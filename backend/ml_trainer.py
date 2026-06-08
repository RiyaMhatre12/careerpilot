import numpy as np
import json
import os
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
import joblib

def load_skill_dataset():
    try:
        with open('data/skill_dataset.json', 'r') as f:
            data = json.load(f)
        print(f"Loaded {len(data)} skill samples")
        return data
    except:
        print("Dataset not found")
        return []

RESUME_SCORING_DATA = [
    ([1,1,1,1,1,20,10,500,7], 95), ([1,1,1,1,1,18,9,480,6], 93),
    ([1,1,1,1,1,15,8,450,5], 92), ([1,1,1,1,1,12,6,400,4], 88),
    ([1,1,1,0,1,14,7,420,4], 85), ([1,1,1,1,0,10,5,380,3], 82),
    ([1,1,1,1,1,11,5,360,3], 80), ([1,1,1,0,0,10,4,350,3], 78),
    ([1,1,0,1,1,8,4,300,2], 75), ([1,1,1,0,0,8,3,320,2], 72),
    ([1,0,1,1,1,8,5,280,3], 70), ([0,1,1,1,0,9,4,280,2], 68),
    ([1,1,0,0,1,7,3,260,2], 65), ([1,0,1,0,1,7,4,300,2], 63),
    ([1,1,0,0,0,6,2,240,1], 60), ([1,0,0,1,1,6,3,220,2], 58),
    ([0,1,1,0,0,7,3,270,2], 62), ([1,0,1,1,0,9,4,310,3], 73),
    ([1,0,1,0,0,5,2,200,1], 55), ([0,1,1,0,1,5,3,250,2], 52),
    ([1,0,0,0,1,4,2,180,1], 48), ([0,0,1,1,0,4,2,160,1], 45),
    ([1,0,0,0,0,3,1,150,0], 40), ([0,1,0,0,1,3,2,200,1], 42),
    ([0,0,0,1,1,3,1,130,0], 38), ([0,0,1,0,0,2,1,100,0], 32),
    ([0,0,0,0,1,2,1,120,0], 28), ([0,0,0,0,0,1,0,80,0], 20),
    ([0,0,0,0,0,0,0,50,0], 15), ([1,1,1,1,1,16,8,460,5], 90),
    ([1,1,1,0,1,13,6,410,4], 83), ([1,1,0,1,1,10,5,340,3], 77),
    ([1,0,1,0,1,8,4,290,2], 68), ([0,1,0,1,0,6,3,210,2], 55),
    ([1,1,1,1,0,12,5,370,3], 79), ([0,1,1,1,1,9,4,300,3], 71),
    ([1,0,0,1,0,5,2,170,1], 50), ([0,0,0,0,0,2,0,90,0], 18),
    ([1,1,0,0,1,8,3,280,2], 67), ([0,1,1,0,1,6,3,250,2], 60),
    ([1,1,1,1,1,17,8,470,6], 91), ([1,0,1,1,1,10,5,320,3], 74),
    ([0,0,1,0,1,4,2,150,1], 43), ([1,1,0,1,0,9,4,330,2], 76),
    ([0,1,0,0,0,3,1,140,0], 35), ([1,0,1,0,0,6,3,220,1], 57),
    ([1,1,1,0,1,11,5,350,3], 81), ([0,0,0,1,0,2,1,110,0], 30),
    ([1,1,0,0,0,7,3,250,2], 64), ([0,1,1,1,0,8,4,270,2], 66),
    ([1,0,0,0,1,4,2,160,1], 46), ([0,0,1,1,1,5,2,180,2], 53),
    ([1,1,1,1,0,13,6,390,4], 84), ([0,0,0,0,1,1,0,70,0], 22),
    ([1,0,1,1,0,7,3,240,2], 69), ([0,1,0,1,1,5,2,200,1], 56),
    ([1,1,0,1,1,10,4,320,3], 76), ([0,0,1,0,0,3,1,130,0], 37),
    ([1,1,1,0,0,9,4,300,2], 72), ([0,1,0,0,1,4,2,180,1], 49),
]

def train_skill_classifier():
    print("Training Skill Domain Classifier...")
    skill_data = load_skill_dataset()
    skills = [item[0] for item in skill_data]
    domains = [item[1] for item in skill_data]

    le = LabelEncoder()
    y = le.fit_transform(domains)

    # Model 1: LinearSVC with char ngrams
    pipe1 = Pipeline([
        ('tfidf', TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(2, 6),
            max_features=50000,
            sublinear_tf=True
        )),
        ('clf', CalibratedClassifierCV(
            LinearSVC(C=5.0, max_iter=5000, class_weight='balanced')
        ))
    ])

    # Model 2: Logistic Regression with word ngrams
    pipe2 = Pipeline([
        ('tfidf', TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 3),
            max_features=20000,
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            C=10.0,
            max_iter=2000,
            class_weight='balanced',
            solver='lbfgs'
        ))
    ])

    # Model 3: Random Forest with char features
    pipe3 = Pipeline([
        ('tfidf', TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(3, 5),
            max_features=30000,
            sublinear_tf=True
        )),
        ('clf', RandomForestClassifier(
            n_estimators=500,
            max_depth=None,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ))
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        skills, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Model 1: LinearSVC...")
    pipe1.fit(X_train, y_train)
    acc1 = accuracy_score(y_test, pipe1.predict(X_test))
    print(f"  LinearSVC Accuracy: {acc1:.2%}")

    print("Training Model 2: Logistic Regression...")
    pipe2.fit(X_train, y_train)
    acc2 = accuracy_score(y_test, pipe2.predict(X_test))
    print(f"  Logistic Regression Accuracy: {acc2:.2%}")

    print("Training Model 3: Random Forest...")
    pipe3.fit(X_train, y_train)
    acc3 = accuracy_score(y_test, pipe3.predict(X_test))
    print(f"  Random Forest Accuracy: {acc3:.2%}")

    models = [
        (acc1, pipe1, "LinearSVC"),
        (acc2, pipe2, "LogisticRegression"),
        (acc3, pipe3, "RandomForest")
    ]
    best_acc, best_model, best_name = max(models, key=lambda x: x[0])
    print(f"\nBest Model: {best_name} with {best_acc:.2%} accuracy")

    print("\nClassification Report:")
    print(classification_report(
        y_test,
        best_model.predict(X_test),
        target_names=le.classes_,
        zero_division=0
    ))

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(best_model, skills, y, cv=cv, scoring='accuracy')
    print(f"Cross-validation: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")

    os.makedirs('models', exist_ok=True)
    joblib.dump(best_model, 'models/skill_classifier.pkl')
    joblib.dump(le, 'models/skill_label_encoder.pkl')
    print("✓ Best Skill Classifier saved")
    return best_acc

def train_resume_scorer():
    print("\nTraining Resume ATS Score Predictor...")
    X = np.array([item[0] for item in RESUME_SCORING_DATA], dtype=float)
    y = np.array([item[1] for item in RESUME_SCORING_DATA], dtype=float)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = GradientBoostingRegressor(
        n_estimators=500,
        learning_rate=0.03,
        max_depth=5,
        min_samples_split=3,
        random_state=42,
        subsample=0.8
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    cv_scores = cross_val_score(
        model, X, y, cv=5,
        scoring='neg_root_mean_squared_error'
    )
    print(f"Resume Scorer RMSE: {rmse:.2f}")
    print(f"Cross-validation RMSE: {-cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")

    feature_names = ['has_education', 'has_experience', 'has_projects',
                     'has_certifications', 'has_summary', 'skill_count',
                     'action_verb_count', 'word_count', 'quantifiable']
    print("\nFeature Importances:")
    for name, imp in sorted(
        zip(feature_names, model.feature_importances_),
        key=lambda x: -x[1]
    ):
        print(f"  {name}: {imp:.3f}")

    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/resume_scorer.pkl')
    print("✓ Resume Scorer saved")
    return rmse

def train_all():
    print("=" * 60)
    print("Training CareerPilot ML Models")
    print("=" * 60)
    skill_accuracy = train_skill_classifier()
    resume_rmse = train_resume_scorer()
    print("=" * 60)
    print(f"✓ Best Skill Classifier Accuracy: {skill_accuracy:.2%}")
    print(f"✓ Resume Scorer RMSE: {resume_rmse:.2f}")
    print("All models trained and saved!")
    print("=" * 60)

if __name__ == "__main__":
    train_all()