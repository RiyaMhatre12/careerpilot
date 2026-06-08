from fastapi import APIRouter, Header
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from ml_engine import semantic_skill_match
import os, json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/skills", tags=["skills"])

class SkillRequest(BaseModel):
    user_skills: list[str]
    target_role: str

class ProgressUpdate(BaseModel):
    completed_topics: list[str]

@router.post("/gap")
def skill_gap(data: SkillRequest, authorization: str = Header(None)):
    # Step 1 — Use Groq LLM to get required skills for the role
    prompt = f"""
    What skills are required for a {data.target_role}?

    Return JSON with exactly these fields:
    - required_skills (list of 15-20 specific technical and soft skills needed for this role)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    role_data = json.loads(clean)
    required_skills = role_data.get("required_skills", [])

    # Step 2 — Use Sentence-BERT + cosine similarity for semantic matching
    ml_result = semantic_skill_match(data.user_skills, required_skills)

    # Step 3 — Use LLM for priority learning recommendations
    prompt2 = f"""
    User has these skills: {data.user_skills}
    Target role: {data.target_role}
    Missing skills: {ml_result['missing_skills']}

    Return JSON with exactly this field:
    - priority_to_learn (list of top 5 most important missing skills to learn first)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response2 = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt2}],
        temperature=0.3
    )
    clean2 = response2.choices[0].message.content.strip().strip("```json").strip("```").strip()
    priority_data = json.loads(clean2)

    result = {
        "has_skills": [m["required"] for m in ml_result["matched_skills"]],
        "missing_skills": ml_result["missing_skills"],
        "match_percentage": ml_result["match_percentage"],
        "priority_to_learn": priority_data.get("priority_to_learn", []),
        "matched_details": ml_result["matched_skills"],
        "required_skills": required_skills,
        "ml_powered": True
    }

    if authorization:
        try:
            from jose import jwt
            from database import db
            from bson import ObjectId
            SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            user_id = payload["sub"]
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "skill_match": ml_result["match_percentage"],
                    "skill_gap_done": True
                }}
            )
        except:
            pass

    return result

@router.post("/roadmap")
def generate_roadmap(data: SkillRequest, authorization: str = Header(None)):
    prompt = f"""
    Create a learning roadmap for someone targeting: {data.target_role}
    Their current skills: {data.user_skills}

    Return JSON with exactly these fields:
    - title (string)
    - estimated_weeks (number)
    - stages (list of objects with: stage_name, topics (list), projects (list), duration_weeks)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    result = json.loads(clean)

    if authorization:
        try:
            from jose import jwt
            from database import db
            from bson import ObjectId
            SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            user_id = payload["sub"]
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "roadmap_done": True,
                    "roadmap_data": result,
                    "completed_topics": []
                }}
            )
        except:
            pass

    return result

@router.get("/roadmap/saved")
def get_saved_roadmap(authorization: str = Header(None)):
    if not authorization:
        return {"roadmap": None}
    try:
        from jose import jwt
        from database import db
        from bson import ObjectId
        SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
        user = db.users.find_one({"_id": ObjectId(user_id)})
        return {
            "roadmap": user.get("roadmap_data"),
            "completed_topics": user.get("completed_topics", [])
        }
    except:
        return {"roadmap": None, "completed_topics": []}

@router.post("/roadmap/progress")
def update_progress(data: ProgressUpdate, authorization: str = Header(None)):
    if not authorization:
        return {"message": "Not saved"}
    try:
        from jose import jwt
        from database import db
        from bson import ObjectId
        SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"completed_topics": data.completed_topics}}
        )
        return {"message": "Progress saved"}
    except:
        return {"message": "Failed"}