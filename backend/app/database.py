import os
from motor.motor_asyncio import AsyncIOMotorClient


from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("MONGODB_URL")
MONGODB_URL = os.environ.get("MONGODB_URL", db_url)

client = AsyncIOMotorClient(MONGODB_URL)
db = client.get_database()
expense_collection = db.get_collection("expenses")
category_collection = db.get_collection("categories")
