from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import spacy
import numpy as np
import re
import joblib
import os

print("Loading ML models...")
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
nlp = spacy.load("en_core_web_sm")

skill_classifier = None
skill_label_encoder = None
resume_scorer = None

try:
    skill_classifier = joblib.load('models/skill_classifier.pkl')
    skill_label_encoder = joblib.load('models/skill_label_encoder.pkl')
    print("✓ Skill Classifier loaded")
except:
    print("⚠ Skill Classifier not found")

try:
    resume_scorer = joblib.load('models/resume_scorer.pkl')
    print("✓ Resume Scorer loaded")
except:
    print("⚠ Resume Scorer not found")

print("ML models loaded successfully")

TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "kotlin", "swift",
    "react", "angular", "vue", "nextjs", "nodejs", "express", "django", "fastapi", "flask", "spring",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "git", "github",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "html", "css", "tailwind", "bootstrap", "sass",
    "rest api", "graphql", "microservices", "agile", "scrum", "devops", "ci/cd",
    "data analysis", "data visualization", "tableau", "power bi", "excel",
    "linux", "bash", "shell scripting", "networking", "cybersecurity",
    "android", "ios", "react native", "flutter", "unity"
]

def classify_skill_domain(skill: str) -> dict:
    if skill_classifier is None:
        return {"domain": "Unknown", "confidence": 0}
    try:
        prediction = skill_classifier.predict([skill.lower()])[0]
        probabilities = skill_classifier.predict_proba([skill.lower()])[0]
        domain = skill_label_encoder.inverse_transform([prediction])[0]
        confidence = round(max(probabilities) * 100, 1)
        return {"domain": domain, "confidence": confidence}
    except:
        return {"domain": "Unknown", "confidence": 0}

def predict_ats_score(features: list) -> float:
    if resume_scorer is None:
        return 0
    try:
        X = np.array([features], dtype=float)
        score = resume_scorer.predict(X)[0]
        return round(float(np.clip(score, 0, 100)), 1)
    except:
        return 0

def predict_resume_ats(resume_features: dict) -> float:
    features = [
        int(resume_features.get("has_education", False)),
        int(resume_features.get("has_experience", False)),
        int(resume_features.get("has_projects", False)),
        int(resume_features.get("has_certifications", False)),
        int(resume_features.get("has_summary", False)),
        len(resume_features.get("skills", [])),
        resume_features.get("action_verb_count", 0),
        resume_features.get("word_count", 0),
        resume_features.get("quantifiable_achievements", 0)
    ]
    return predict_ats_score(features)

def get_skill_domains(skills: list) -> list:
    results = []
    for skill in skills:
        classification = classify_skill_domain(skill)
        results.append({
            "skill": skill,
            "domain": classification["domain"],
            "confidence": classification["confidence"]
        })
    return results

def extract_skills_nlp(text: str) -> list:
    text_lower = text.lower()
    found_skills = []

    for skill in TECH_SKILLS:
        if skill in text_lower:
            found_skills.append(skill.title())

    doc = nlp(text[:5000])
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "GPE"]:
            skill = ent.text.strip()
            if len(skill) > 2 and len(skill) < 30:
                if skill.lower() not in [s.lower() for s in found_skills]:
                    found_skills.append(skill)

    tech_pattern = re.findall(r'\b[A-Z][a-zA-Z+#.]*(?:\s[A-Z][a-zA-Z+#.]*)*\b', text)
    for term in tech_pattern:
        if len(term) > 2 and len(term) < 25:
            if term.lower() not in [s.lower() for s in found_skills]:
                if term.lower() not in ['the', 'and', 'for', 'with', 'from']:
                    found_skills.append(term)

    return list(set(found_skills))[:30]

def semantic_skill_match(user_skills: list, required_skills: list) -> dict:
    if not user_skills or not required_skills:
        return {
            "match_percentage": 0,
            "matched_skills": [],
            "missing_skills": required_skills,
            "similarity_scores": {}
        }

    user_embeddings = sentence_model.encode(user_skills)
    required_embeddings = sentence_model.encode(required_skills)
    similarity_matrix = cosine_similarity(user_embeddings, required_embeddings)

    matched_skills = []
    missing_skills = []
    similarity_scores = {}

    for j, req_skill in enumerate(required_skills):
        scores = similarity_matrix[:, j]
        best_match_idx = np.argmax(scores)
        best_score = scores[best_match_idx]
        similarity_scores[req_skill] = float(best_score)

        if best_score >= 0.6:
            matched_skills.append({
                "required": req_skill,
                "matched_with": user_skills[best_match_idx],
                "confidence": round(float(best_score) * 100, 1)
            })
        else:
            missing_skills.append(req_skill)

    match_percentage = round((len(matched_skills) / len(required_skills)) * 100)

    return {
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "similarity_scores": similarity_scores
    }

def calculate_resume_ml_score(text: str) -> dict:
    doc = nlp(text[:5000])

    action_verbs = ["developed", "built", "created", "designed", "implemented",
                   "led", "managed", "optimized", "improved", "achieved",
                   "deployed", "architected", "automated", "reduced", "increased"]

    text_lower = text.lower()
    action_verb_count = sum(1 for verb in action_verbs if verb in text_lower)
    numbers = re.findall(r'\d+(?:\.\d+)?%|\d+(?:,\d+)*(?:\.\d+)?', text)
    quantifiable_count = len(numbers)
    sentences = list(doc.sents)
    word_count = len(text.split())

    action_score = min(action_verb_count * 10, 40)
    quantifiable_score = min(quantifiable_count * 5, 30)
    length_score = 30 if 200 < word_count < 800 else 15
    ml_quality_score = action_score + quantifiable_score + length_score

    return {
        "ml_quality_score": ml_quality_score,
        "action_verb_count": action_verb_count,
        "quantifiable_achievements": quantifiable_count,
        "word_count": word_count,
        "sentence_count": len(sentences)
    }