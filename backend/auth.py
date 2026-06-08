from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from database import db
from datetime import datetime, timedelta
from email_service import send_welcome_email, send_reset_email
import os, secrets

router = APIRouter(prefix="/auth", tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"])
SECRET = os.getenv("SECRET_KEY", "careerpilot_secret_123")

class SignupData(BaseModel):
    name: str
    email: str
    password: str
    target_role: str

class LoginData(BaseModel):
    email: str
    password: str

class ForgotData(BaseModel):
    email: str

class ResetData(BaseModel):
    token: str
    new_password: str

class UpdateProfileData(BaseModel):
    target_role: str
    experience_level: str
    domain: str

@router.post("/signup")
def signup(data: SignupData):
    if db.users.find_one({"email": data.email}):
        raise HTTPException(400, "Email already registered")
    hashed = pwd.hash(data.password)
    db.users.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hashed,
        "target_role": data.target_role,
        "skills": [],
        "experience_level": "",
        "domain": "",
        "resume_uploaded": False,
        "resume_score": 0,
        "profile_completeness": 0,
        "has_education": False,
        "has_experience": False,
        "has_projects": False,
        "has_certifications": False,
        "has_summary": False,
        "education_details": [],
        "experience_details": [],
        "project_details": [],
        "certification_details": [],
        "skill_gap_done": False,
        "skill_match": 0,
        "roadmap_done": False,
        "interview_score": 0,
        "quiz_score": 0,
        "readiness_score": 0,
        "created_at": datetime.utcnow()
    })
    try:
        send_welcome_email(data.name, data.email)
    except:
        pass
    return {"message": "Account created"}

@router.post("/login")
def login(data: LoginData):
    user = db.users.find_one({"email": data.email})
    if not user or not pwd.verify(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = jwt.encode(
        {"sub": str(user["_id"]), "exp": datetime.utcnow() + timedelta(days=7)},
        SECRET,
        algorithm="HS256"
    )
    return {
        "token": token,
        "name": user["name"],
        "resume_uploaded": user.get("resume_uploaded", False)
    }

@router.get("/me")
def get_me(authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    user_id = payload["sub"]
    from bson import ObjectId
    user = db.users.find_one({"_id": ObjectId(user_id)})
    return {
        "name": user["name"],
        "email": user["email"],
        "target_role": user.get("target_role", ""),
        "experience_level": user.get("experience_level", ""),
        "domain": user.get("domain", ""),
        "skills": user.get("skills", []),
        "resume_uploaded": user.get("resume_uploaded", False),
        "resume_score": user.get("resume_score", 0),
        "profile_completeness": user.get("profile_completeness", 0),
        "has_education": user.get("has_education", False),
        "has_experience": user.get("has_experience", False),
        "has_projects": user.get("has_projects", False),
        "has_certifications": user.get("has_certifications", False),
        "has_summary": user.get("has_summary", False),
        "education_details": user.get("education_details", []),
        "experience_details": user.get("experience_details", []),
        "project_details": user.get("project_details", []),
        "certification_details": user.get("certification_details", []),
        "skill_gap_done": user.get("skill_gap_done", False),
        "skill_match": user.get("skill_match", 0),
        "roadmap_done": user.get("roadmap_done", False),
        "interview_score": user.get("interview_score", 0),
        "quiz_score": user.get("quiz_score", 0),
        "readiness_score": user.get("readiness_score", 0)
    }

@router.put("/update-profile")
def update_profile(data: UpdateProfileData, authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    user_id = payload["sub"]
    from bson import ObjectId

    existing_user = db.users.find_one({"_id": ObjectId(user_id)})
    role_changed = existing_user.get("target_role", "") != data.target_role

    update_data = {
        "target_role": data.target_role,
        "experience_level": data.experience_level,
        "domain": data.domain
    }

    if role_changed:
        update_data["skill_gap_done"] = False
        update_data["roadmap_done"] = False
        update_data["interview_score"] = 0
        update_data["readiness_score"] = 0
        update_data["skill_match"] = 0
        update_data["quiz_score"] = 0

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    return {
        "message": "Profile updated",
        "role_changed": role_changed
    }

@router.post("/calculate-readiness")
def calculate_readiness(authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "")
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    user_id = payload["sub"]
    from bson import ObjectId
    user = db.users.find_one({"_id": ObjectId(user_id)})

    resume_score = user.get("resume_score", 0)
    profile_completeness = user.get("profile_completeness", 0)
    skill_match = user.get("skill_match", 0)
    quiz_score = user.get("quiz_score", 0)
    interview_score = user.get("interview_score", 0)

    # Weighted calculation
    # Resume: 15%, Profile Completeness: 10%, Skill Match: 25%, Quiz: 20%, Interview: 30%
    readiness = round(
        (resume_score * 0.15) +
        (profile_completeness * 0.10) +
        (skill_match * 0.25) +
        (quiz_score * 0.20) +
        (interview_score * 0.30)
    )

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"readiness_score": readiness}}
    )

    return {
        "readiness_score": readiness,
        "breakdown": {
            "resume": resume_score,
            "profile_completeness": profile_completeness,
            "skill_match": skill_match,
            "quiz": quiz_score,
            "interview": interview_score
        }
    }

@router.post("/forgot-password")
def forgot_password(data: ForgotData):
    user = db.users.find_one({"email": data.email})
    if not user:
        raise HTTPException(404, "Email not found")
    token = secrets.token_urlsafe(32)
    db.users.update_one(
        {"email": data.email},
        {"$set": {"reset_token": token, "reset_expiry": datetime.utcnow() + timedelta(hours=1)}}
    )
    try:
        send_reset_email(user["name"], data.email, token)
    except:
        pass
    return {"message": "Reset email sent"}

@router.post("/reset-password")
def reset_password(data: ResetData):
    user = db.users.find_one({"reset_token": data.token})
    if not user:
        raise HTTPException(400, "Invalid token")
    if datetime.utcnow() > user["reset_expiry"]:
        raise HTTPException(400, "Token expired")
    hashed = pwd.hash(data.new_password)
    db.users.update_one(
        {"reset_token": data.token},
        {"$set": {"password": hashed}, "$unset": {"reset_token": "", "reset_expiry": ""}}
    )
    return {"message": "Password reset successful"}