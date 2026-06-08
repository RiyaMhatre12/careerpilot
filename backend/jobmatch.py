from fastapi import APIRouter, Header
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from ml_engine import semantic_skill_match, extract_skills_nlp
import os, json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/jobmatch", tags=["jobmatch"])

class JobMatchRequest(BaseModel):
    job_description: str
    user_skills: list[str]
    target_role: str

@router.post("/analyze")
def analyze_job_match(data: JobMatchRequest, authorization: str = Header(None)):

    # Step 1 — Extract required skills from JD using NLP
    jd_skills_nlp = extract_skills_nlp(data.job_description)

    # Step 2 — Use LLM to get structured JD requirements
    prompt = f"""
    Extract requirements from this job description.

    Job Description:
    {data.job_description[:2000]}

    Return JSON with exactly these fields:
    - required_skills (list of technical and soft skills required)
    - preferred_skills (list of nice-to-have skills)
    - experience_required (string)
    - role_summary (string - 1 sentence about the role)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    jd_data = json.loads(clean)

    # Step 3 — Merge NLP + LLM extracted skills
    required_skills = list(set(jd_skills_nlp + jd_data.get("required_skills", [])))

    # Step 4 — Semantic matching using Sentence-BERT
    ml_result = semantic_skill_match(data.user_skills, required_skills)

    # Step 5 — LLM for human-readable feedback
    prompt2 = f"""
    Candidate role target: {data.target_role}
    Candidate skills: {data.user_skills}
    Job required skills: {required_skills}
    Match percentage: {ml_result['match_percentage']}%
    Missing skills: {ml_result['missing_skills']}

    Return JSON with exactly these fields:
    - strong_points (list of 3 strings)
    - improvement_areas (list of 3 strings)
    - recommendation (string - one of: "Strong Match", "Good Match", "Partial Match", "Weak Match")
    - summary (string - 2 sentence overall assessment)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response2 = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt2}],
        temperature=0.3
    )
    clean2 = response2.choices[0].message.content.strip().strip("```json").strip("```").strip()
    feedback = json.loads(clean2)

    return {
        "match_percentage": ml_result["match_percentage"],
        "matched_skills": [m["required"] for m in ml_result["matched_skills"]],
        "matched_details": ml_result["matched_skills"],
        "missing_skills": ml_result["missing_skills"],
        "required_skills": required_skills,
        "strong_points": feedback.get("strong_points", []),
        "improvement_areas": feedback.get("improvement_areas", []),
        "recommendation": feedback.get("recommendation", ""),
        "summary": feedback.get("summary", ""),
        "role_summary": jd_data.get("role_summary", ""),
        "experience_required": jd_data.get("experience_required", ""),
        "ml_powered": True
    }