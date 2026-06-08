from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from resume import router as resume_router
from skills import router as skills_router
from interview import router as interview_router
from quiz import router as quiz_router
from jobmatch import router as jobmatch_router

app = FastAPI(title="CareerPilot API")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://careerpilot.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CareerPilot API running"}

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(skills_router)
app.include_router(interview_router)
app.include_router(quiz_router)
app.include_router(jobmatch_router)