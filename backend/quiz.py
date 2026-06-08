from fastapi import APIRouter, Header
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os, json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/quiz", tags=["quiz"])

class QuizRequest(BaseModel):
    target_role: str
    skills: list[str]
    num_questions: int = 10

class QuizSubmit(BaseModel):
    questions: list[dict]
    answers: list[int]

@router.post("/generate")
def generate_quiz(data: QuizRequest):
    prompt = f"""
    Create a {data.num_questions}-question multiple choice quiz for someone targeting: {data.target_role}
    Their skills: {data.skills}

    Return JSON with exactly this field:
    - questions (list of objects with exactly these fields:
        - question (string)
        - options (list of exactly 4 strings)
        - correct (number 0-3, index of correct option)
        - explanation (string - why this is correct)
    )

    Make questions test practical knowledge relevant to the role.
    Return ONLY valid JSON, no extra text, no markdown.
    """
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    clean = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
    return json.loads(clean)

@router.post("/submit")
def submit_quiz(data: QuizSubmit, authorization: str = Header(None)):
    correct = sum(
        1 for i, q in enumerate(data.questions)
        if i < len(data.answers) and data.answers[i] == q.get("correct")
    )
    score = round((correct / len(data.questions)) * 100)

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
                {"$set": {"quiz_score": score}}
            )
        except:
            pass

    return {
        "score": score,
        "correct": correct,
        "total": len(data.questions)
    }