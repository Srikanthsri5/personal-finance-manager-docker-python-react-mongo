from fastapi import APIRouter, Body
from fastapi.encoders import jsonable_encoder

from app.database import (
    category_collection,
    category_helper,
)
from app.models import (
    CategoryModel,
    ResponseModel,
    ErrorResponseModel,
)
from bson.objectid import ObjectId

router = APIRouter()

@router.post("/", response_description="Category data added into the database")
async def add_category_data(category: CategoryModel = Body(...)):
    category = jsonable_encoder(category)
    new_category = await category_collection.insert_one(category)
    created_category = await category_collection.find_one({"_id": new_category.inserted_id})
    return category_helper(created_category)

@router.get("/", response_description="Categories retrieved")
async def get_categories():
    categories = []
    async for category in category_collection.find():
        categories.append(category_helper(category))
    # If no categories, maybe add defaults?
    if not categories:
        default_categories = ["Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Other"]
        # This logic should be improved to avoid inserting every time, but for dev it's ok
        # Actually better to just return list if empty or seeded elsewhere
        return default_categories 
        
    return [c['name'] for c in categories]

@router.delete("/{id}", response_description="Category data deleted from the database")
async def delete_category_data(id: str):
    delete_result = await category_collection.delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return ResponseModel(data=[], message=f"Category with ID {id} removed")

    return ErrorResponseModel(error="An error occurred", code=404, message=f"Category with ID {id} doesn't exist")
