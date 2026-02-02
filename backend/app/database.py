import os
from motor.motor_asyncio import AsyncIOMotorClient


from dotenv import load_dotenv

import certifi

load_dotenv()
db_url = os.environ.get("MONGODB_URL")
MONGODB_URL = os.environ.get("MONGODB_URL", db_url)

# Debug: Print loaded URL status (Masked)
if MONGODB_URL:
    print(f"DEBUG: MONGODB_URL loaded. +srv present: {'+srv' in MONGODB_URL}")
else:
    print("CRITICAL: MONGODB_URL is NOT loaded or empty.")

client = AsyncIOMotorClient(
    MONGODB_URL, 
    tlsCAFile=certifi.where(),
    tls=True,
    tlsAllowInvalidCertificates=True
)
db = client.get_database()
expense_collection = db.get_collection("expenses")
category_collection = db.get_collection("categories")
