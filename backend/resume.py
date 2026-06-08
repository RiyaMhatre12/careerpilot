from fastapi import APIRouter, UploadFile, File, Header
from PyPDF2 import PdfReader
from groq import Groq
from dotenv import load_dotenv
from database import db
from ml_engine import extract_skills_nlp, calculate_resume_ml_score, predict_resume_ats, get_skill_domains
import os, io, json
from datetime import datetime, timedelta

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/resume", tags=["resume"])

def extract_text(file_bytes):
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(p.extract_text() or "" for p in reader.pages)

@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), authorization: str = Header(None)):
    content = await file.read()
    text = extract_text(content)

    # Step 1 — NLP skill extraction
    nlp_skills = extract_skills_nlp(text)

    # Step 2 — ML resume quality analysis
    ml_scores = calculate_resume_ml_score(text)

    # Step 3 — LLM analysis
    prompt = f"""
    Analyze this resume and return a JSON with exactly these fields:
    - ats_score (number 0-100)
    - strengths (list of 3 strings)
    - weaknesses (list of 3 strings)
    - missing_keywords (list of strings)
    - suggestions (list of 5 strings)
    - extracted_skills (list of all technical and soft skills found in resume)
    - suggested_role (string - best job role this person is suited for based on resume content)
    - experience_level (string - exactly one of: Beginner, Intermediate, Advanced)
    - domain (string - exactly one of: Web Development, Data Science, DevOps, Mobile Dev, AI/ML, Cybersecurity)
    - resume_improvements (list of 5 specific improvements for resume framing, structure and key points)
    - has_education (boolean - true if education section exists)
    - has_experience (boolean - true if work experience or internship section exists)
    - has_projects (boolean - true if projects section exists)
    - has_certifications (boolean - true if certifications section exists)
    - has_summary (boolean - true if professional summary or objective exists)
    - education_details (list of strings - degree, institution, year if found)
    - experience_details (list of strings - job titles and companies if found)
    - project_details (list of strings - project names if found)
    - certification_details (list of strings - certification names if found)

    Resume text:
    {text[:3000]}

    Return ONLY valid JSON, no extra text, no markdown.
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    result = json.loads(clean)

    # Step 4 — Merge NLP + LLM skills
    llm_skills = result.get("extracted_skills", [])
    all_skills = list(set(nlp_skills + llm_skills))
    result["extracted_skills"] = all_skills
    result["nlp_extracted_skills"] = nlp_skills
    result["ml_quality_score"] = ml_scores["ml_quality_score"]
    result["action_verb_count"] = ml_scores["action_verb_count"]
    result["quantifiable_achievements"] = ml_scores["quantifiable_achievements"]
    result["word_count"] = ml_scores["word_count"]

    # Step 5 — Profile completeness
    sections = [
        result.get("has_education", False),
        result.get("has_experience", False),
        result.get("has_projects", False),
        result.get("has_certifications", False),
        result.get("has_summary", False),
        len(all_skills) >= 5
    ]
    completeness_score = round((sum(sections) / len(sections)) * 100)
    result["profile_completeness"] = completeness_score

    # Step 6 — ML ATS prediction using trained Gradient Boosting model
    ml_predicted_ats = predict_resume_ats({
        "has_education": result.get("has_education", False),
        "has_experience": result.get("has_experience", False),
        "has_projects": result.get("has_projects", False),
        "has_certifications": result.get("has_certifications", False),
        "has_summary": result.get("has_summary", False),
        "skills": all_skills,
        "action_verb_count": ml_scores["action_verb_count"],
        "word_count": ml_scores["word_count"],
        "quantifiable_achievements": ml_scores["quantifiable_achievements"]
    })

    # Step 7 — Classify skills into domains using trained Random Forest
    skill_domains = get_skill_domains(all_skills[:10])
    result["skill_domains"] = skill_domains

    # Step 8 — Blend LLM ATS (60%) + ML predicted ATS (40%)
    llm_ats = result.get("ats_score", 0)
    blended_ats = round((llm_ats * 0.6) + (ml_predicted_ats * 0.4))
    result["ats_score"] = blended_ats
    result["ml_predicted_ats"] = ml_predicted_ats
    result["llm_ats_score"] = llm_ats

    if authorization:
        try:
            from jose import jwt
            SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            user_id = payload["sub"]
            from bson import ObjectId

            existing_user = db.users.find_one({"_id": ObjectId(user_id)})
            existing_role = existing_user.get("target_role", "").strip()
            existing_experience = existing_user.get("experience_level", "").strip()
            existing_domain = existing_user.get("domain", "").strip()

            last_upload = existing_user.get("last_upload_time")
            upload_count = existing_user.get("resume_upload_count", 0)
            if last_upload and datetime.utcnow() - last_upload > timedelta(hours=24):
                upload_count = 0
            upload_count += 1
            multiple_uploads_warning = upload_count > 2

            update_data = {
                "resume_uploaded": True,
                "resume_score": blended_ats,
                "skills": all_skills,
                "resume_upload_count": upload_count,
                "last_upload_time": datetime.utcnow(),
                "profile_completeness": completeness_score,
                "ml_quality_score": ml_scores["ml_quality_score"],
                "has_education": result.get("has_education", False),
                "has_experience": result.get("has_experience", False),
                "has_projects": result.get("has_projects", False),
                "has_certifications": result.get("has_certifications", False),
                "has_summary": result.get("has_summary", False),
                "education_details": result.get("education_details", []),
                "experience_details": result.get("experience_details", []),
                "project_details": result.get("project_details", []),
                "certification_details": result.get("certification_details", []),
                "skill_gap_done": False,
                "roadmap_done": False,
                "skill_match": 0,
                "quiz_score": 0,
                "interview_score": 0,
                "readiness_score": 0
            }

            if not existing_role:
                update_data["target_role"] = result.get("suggested_role", "")
            if not existing_experience:
                update_data["experience_level"] = result.get("experience_level", "")
            if not existing_domain:
                update_data["domain"] = result.get("domain", "")

            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )

            result["skills_updated"] = True
            result["suggested_role"] = result.get("suggested_role", "")
            result["existing_role"] = existing_role
            result["multiple_uploads_warning"] = multiple_uploads_warning
            result["upload_count"] = upload_count

        except Exception as e:
            print(f"DB update error: {e}")

    return result