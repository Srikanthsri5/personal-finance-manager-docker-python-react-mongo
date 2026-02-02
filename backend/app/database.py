import os
from motor.motor_asyncio import AsyncIOMotorClient


from dotenv import load_dotenv

import certifi

load_dotenv()
db_url = os.environ.get("MONGODB_URL")
MONGODB_URL = os.environ.get("MONGODB_URL", db_url)

client = AsyncIOMotorClient(
    MONGODB_URL, 
    tlsCAFile=certifi.where(),
    tls=True,
    tlsAllowInvalidCertificates=True
)
db = client.get_database()
expense_collection = db.get_collection("expenses")
category_collection = db.get_collection("categories")
