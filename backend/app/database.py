# backend/app/database.py

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI not found in environment variables")

client = MongoClient(MONGODB_URI)

# Database name comes from URI: /facelog_ai
db = client["facelog_ai"]

# Collections (logical structure)
persons_collection = db["persons"]
events_collection = db["recognition_events"]
