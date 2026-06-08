from fastapi import APIRouter, Header
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os, json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/interview", tags=["interview"])

class InterviewRequest(BaseModel):
    target_role: str
    skills: list[str]
    interview_type: str

class EvalRequest(BaseModel):
    question: str
    answer: str
    role: str

class SaveScoreRequest(BaseModel):
    score: int

@router.post("/questions")
def get_questions(data: InterviewRequest):
    prompt = f"""
    Generate 5 {data.interview_type} interview questions for {data.target_role}.
    Candidate skills: {data.skills}

    Return JSON with exactly this field:
    - questions (list of 5 question strings)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    return json.loads(clean)

@router.post("/evaluate")
def evaluate_answer(data: EvalRequest):
    prompt = f"""
    Question: {data.question}
    Candidate answer: {data.answer}
    Role: {data.role}

    Evaluate and return JSON with exactly these fields:
    - score (number 0-10)
    - feedback (string)
    - what_was_good (string)
    - what_to_improve (string)

    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    return json.loads(clean)

@router.post("/save-score")
def save_score(data: SaveScoreRequest, authorization: str = Header(None)):
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
                {"$set": {"interview_score": data.score}}
            )
        except:
            pass
    return {"message": "Score saved"}