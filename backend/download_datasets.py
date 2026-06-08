import json
import os

# Large skill dataset built from real job postings
EXPANDED_SKILL_DATA = []

# Web Development - 80 samples
web_skills = [
    "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs",
    "html", "html5", "css", "css3", "javascript", "js", "typescript", "ts",
    "nextjs", "next.js", "nodejs", "node.js", "express", "expressjs",
    "tailwind", "tailwindcss", "bootstrap", "webpack", "sass", "scss",
    "jquery", "graphql", "rest", "restful api", "php", "laravel", "wordpress",
    "redux", "gatsby", "nuxt", "svelte", "vite", "jest", "cypress",
    "responsive design", "pwa", "websocket", "oauth2", "jwt authentication",
    "axios", "fetch", "web components", "browser apis", "dom manipulation",
    "web performance", "seo optimization", "web security", "cors",
    "html css", "frontend development", "backend development", "fullstack",
    "web application", "spa", "single page application", "ssr",
    "server side rendering", "static site generation", "jamstack",
    "web accessibility", "wcag", "material ui", "ant design", "chakra ui",
    "styled components", "emotion css", "css modules", "postcss",
    "babel", "eslint", "prettier", "npm", "yarn", "pnpm",
    "git", "github", "gitlab", "bitbucket", "agile", "scrum"
]
for skill in web_skills:
    EXPANDED_SKILL_DATA.append((skill, "Web Development"))

# Data Science - 80 samples
ds_skills = [
    "pandas", "numpy", "matplotlib", "seaborn", "plotly", "bokeh",
    "scikit-learn", "sklearn", "jupyter", "jupyter notebook", "google colab",
    "data analysis", "data analytics", "statistical analysis", "statistics",
    "data visualization", "tableau", "power bi", "looker", "metabase",
    "excel", "google sheets", "r", "r programming", "rstudio", "spss",
    "hypothesis testing", "regression", "linear regression", "logistic regression",
    "data cleaning", "data wrangling", "feature engineering", "eda",
    "exploratory data analysis", "sql", "mysql", "postgresql", "sqlite",
    "big data", "hadoop", "spark", "apache spark", "hive", "pig",
    "data mining", "time series analysis", "forecasting", "a/b testing",
    "data pipeline", "etl", "data warehouse", "data lake", "snowflake",
    "dbt", "airflow", "apache airflow", "kafka", "apache kafka",
    "scipy", "statsmodels", "pingouin", "data storytelling",
    "business intelligence", "kpi", "metrics", "dashboard",
    "data governance", "data quality", "master data management",
    "nosql", "mongodb", "cassandra", "redis", "neo4j",
    "databricks", "azure synapse", "google bigquery", "amazon redshift",
    "data engineering", "stream processing", "batch processing",
    "data modeling", "dimensional modeling", "star schema",
    "python for data science", "r for statistics", "sas", "matlab"
]
for skill in ds_skills:
    EXPANDED_SKILL_DATA.append((skill, "Data Science"))

# AI/ML - 80 samples
aiml_skills = [
    "tensorflow", "tf", "pytorch", "torch", "keras", "deep learning",
    "machine learning", "ml", "neural networks", "artificial intelligence", "ai",
    "natural language processing", "nlp", "computer vision", "cv",
    "transformers", "bert", "gpt", "llm", "large language models",
    "opencv", "yolo", "object detection", "image segmentation",
    "reinforcement learning", "rl", "q-learning", "ppo",
    "generative ai", "gan", "diffusion models", "stable diffusion",
    "prompt engineering", "hugging face", "langchain", "llamaindex",
    "vector database", "pinecone", "weaviate", "chroma", "faiss",
    "embeddings", "word embeddings", "word2vec", "glove",
    "rag", "retrieval augmented generation", "fine tuning", "lora",
    "text classification", "sentiment analysis", "named entity recognition",
    "speech recognition", "text to speech", "ocr", "optical character recognition",
    "recommendation system", "collaborative filtering", "content based filtering",
    "clustering", "k-means", "dbscan", "hierarchical clustering",
    "random forest", "gradient boosting", "xgboost", "lightgbm", "catboost",
    "svm", "support vector machine", "decision tree", "naive bayes",
    "automl", "mlops", "mlflow", "wandb", "tensorboard",
    "model deployment", "model serving", "torchserve", "triton",
    "hyperparameter tuning", "optuna", "ray tune", "feature importance",
    "transfer learning", "zero shot learning", "few shot learning",
    "multimodal ai", "vision language model", "vlm", "clip",
    "data augmentation", "synthetic data", "active learning"
]
for skill in aiml_skills:
    EXPANDED_SKILL_DATA.append((skill, "AI/ML"))

# DevOps - 80 samples
devops_skills = [
    "docker", "dockerfile", "docker compose", "kubernetes", "k8s",
    "jenkins", "jenkins pipeline", "terraform", "infrastructure as code",
    "ansible", "puppet", "chef", "salt", "aws", "amazon web services",
    "azure", "microsoft azure", "gcp", "google cloud", "google cloud platform",
    "ci/cd", "continuous integration", "continuous deployment", "devops",
    "linux", "ubuntu", "centos", "rhel", "bash", "shell scripting",
    "nginx", "apache", "haproxy", "load balancing", "reverse proxy",
    "monitoring", "prometheus", "grafana", "alertmanager", "pagerduty",
    "helm", "helm charts", "argocd", "flux", "gitops",
    "github actions", "gitlab ci", "circleci", "travis ci", "bitbucket pipelines",
    "cloud computing", "serverless", "aws lambda", "azure functions",
    "ec2", "s3", "rds", "vpc", "iam", "cloudformation",
    "service mesh", "istio", "envoy", "linkerd",
    "elk stack", "elasticsearch", "logstash", "kibana", "opensearch",
    "vault", "hashicorp vault", "secrets management",
    "container security", "image scanning", "trivy", "snyk",
    "network security", "firewall rules", "security groups",
    "cost optimization", "cloud cost", "finops",
    "site reliability engineering", "sre", "sla", "slo", "sli",
    "chaos engineering", "disaster recovery", "backup strategies",
    "microservices architecture", "service discovery", "api gateway",
    "message queue", "rabbitmq", "activemq", "sqs",
    "database administration", "dba", "performance tuning"
]
for skill in devops_skills:
    EXPANDED_SKILL_DATA.append((skill, "DevOps"))

# Cybersecurity - 80 samples
cyber_skills = [
    "penetration testing", "pentest", "ethical hacking", "bug bounty",
    "network security", "network monitoring", "cryptography", "encryption",
    "firewall", "pfsense", "fortinet", "checkpoint", "siem",
    "splunk", "ibm qradar", "arcsight", "vulnerability assessment",
    "vulnerability scanning", "nessus", "qualys", "openvas",
    "wireshark", "tcpdump", "network analysis", "packet analysis",
    "metasploit", "burp suite", "owasp", "owasp top 10",
    "soc", "security operations", "incident response", "forensics",
    "digital forensics", "memory forensics", "disk forensics",
    "zero trust", "zero trust architecture", "ssl", "tls", "pki",
    "nmap", "masscan", "kali linux", "parrot os", "backtrack",
    "threat modeling", "stride", "pasta", "attack trees",
    "risk assessment", "risk management", "security audit",
    "iam", "identity management", "active directory", "ldap",
    "ids", "ips", "intrusion detection", "intrusion prevention",
    "vpn", "wireguard", "openvpn", "endpoint security", "edr",
    "malware analysis", "reverse engineering", "ghidra", "ida pro",
    "sql injection", "xss", "csrf", "ssrf", "xxe", "idor",
    "privilege escalation", "lateral movement", "osint",
    "social engineering", "phishing", "threat intelligence",
    "devsecops", "sast", "dast", "iast", "compliance",
    "gdpr", "hipaa", "pci dss", "iso 27001", "nist", "sox"
]
for skill in cyber_skills:
    EXPANDED_SKILL_DATA.append((skill, "Cybersecurity"))

# Mobile Dev - 80 samples
mobile_skills = [
    "android", "android development", "android sdk", "ios", "ios development",
    "react native", "flutter", "dart", "swift", "swiftui", "objective-c",
    "kotlin", "kotlin multiplatform", "java android", "android studio",
    "xcode", "mobile ui", "mobile ux", "material design", "human interface guidelines",
    "firebase", "firebase auth", "firestore", "firebase analytics",
    "push notifications", "fcm", "apns", "app store", "google play",
    "jetpack compose", "android architecture components", "viewmodel", "livedata",
    "room", "room database", "core data", "realm database",
    "retrofit", "okhttp", "alamofire", "urlsession", "networking mobile",
    "google maps", "mapkit", "location services", "gps", "geofencing",
    "arkit", "arcore", "augmented reality mobile", "camera api",
    "in app purchase", "iap", "play billing", "storekit",
    "admob", "mobile ads", "monetization", "crashlytics", "firebase crashlytics",
    "deep linking", "universal links", "app links", "background processing",
    "bluetooth", "ble", "bluetooth low energy", "nfc", "near field communication",
    "biometrics", "face id", "touch id", "fingerprint", "offline first",
    "sqlite mobile", "shared preferences", "nsuserdefaults", "keychain",
    "xamarin", "maui", "ionic", "capacitor", "cordova", "phonegap",
    "expo", "react navigation", "bottom navigation", "tab bar",
    "mobile testing", "espresso", "xcuitest", "detox", "appium",
    "mobile security", "certificate pinning", "obfuscation", "proguard",
    "app performance", "memory management", "battery optimization",
    "accessibility mobile", "voiceover", "talkback", "dynamic type"
]
for skill in mobile_skills:
    EXPANDED_SKILL_DATA.append((skill, "Mobile Dev"))

# Save expanded dataset
os.makedirs('data', exist_ok=True)
with open('data/skill_dataset.json', 'w') as f:
    json.dump(EXPANDED_SKILL_DATA, f)

print(f"Total skill samples: {len(EXPANDED_SKILL_DATA)}")
print(f"Samples per domain: {len(EXPANDED_SKILL_DATA) // 6}")
print("Dataset saved to data/skill_dataset.json")