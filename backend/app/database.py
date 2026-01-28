import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb://localhost:27017/pfm_db")

client = AsyncIOMotorClient(MONGODB_URL)
db = client.get_database()
expense_collection = db.get_collection("expenses")
