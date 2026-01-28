import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.environ.get("MONGODB_URL", "mongodb+srv://srikanthsri051199:2KcU3HEsjTGDQeD5@personal-finance.r95w4we.mongodb.net/pfm_db")

client = AsyncIOMotorClient(MONGODB_URL)
db = client.get_database()
expense_collection = db.get_collection("expenses")
