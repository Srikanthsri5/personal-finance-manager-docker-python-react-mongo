from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# Create a new client and connect to the server
client = MongoClient(MONGO_URI)

db = client.finance_tracker

categories_collection = db['categories']
expenses_collection = db['expenses']