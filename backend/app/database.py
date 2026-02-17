from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.expenses_db

expense_collection = database.get_collection("expenses_collection")
category_collection = database.get_collection("categories_collection")

# Helper functions
def expense_helper(expense) -> dict:
    return {
        "id": str(expense["_id"]),
        "title": expense["title"],
        "amount": expense["amount"],
        "category": expense["category"],
        "type": expense["type"],
        "date": expense.get("date"),
        "notes": expense.get("notes"),
    }

def category_helper(category) -> dict:
    return {
        "id": str(category["_id"]),
        "name": category["name"],
        "type": category.get("type", "expense"), # income or expense
    }
