from dotenv import load_dotenv
load_dotenv()

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import certifi
import os

MONGO_URI = os.getenv("MONGO_URI")
print(f"Connecting to: {MONGO_URI}")

client = MongoClient(
    MONGO_URI,
    server_api=ServerApi('1'),
    tlsCAFile=certifi.where()
)

db = client["careerpilot"]