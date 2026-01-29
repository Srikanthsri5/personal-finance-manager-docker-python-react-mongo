from fastapi import APIRouter, Body, HTTPException, status
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

from ..models import CategoryModel, CategoryCreate, CategoryUpdate
from ..database import category_collection

router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)

@router.post("/", response_description="Add new category", response_model=CategoryModel)
async def create_category(category: CategoryCreate = Body(...)):
    category_dict = jsonable_encoder(category)
    new_category = await category_collection.insert_one(category_dict)
    created_category = await category_collection.find_one({"_id": new_category.inserted_id})
    return created_category

@router.get("/", response_description="List all categories", response_model=List[CategoryModel])
async def list_categories():
    categories = await category_collection.find().to_list(1000)
    return categories

@router.get("/{id}", response_description="Get a single category", response_model=CategoryModel)
async def show_category(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if (category := await category_collection.find_one({"_id": oid})) is not None:
        return category
    raise HTTPException(status_code=404, detail=f"Category {id} not found")

@router.put("/{id}", response_description="Update an category", response_model=CategoryModel)
async def update_category(id: str, category: CategoryUpdate = Body(...)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    category_dict = {k: v for k, v in category.model_dump(exclude_unset=True).items()}

    if len(category_dict) >= 1:
        update_result = await category_collection.update_one({"_id": oid}, {"$set": category_dict})
        if update_result.modified_count == 1:
            if (updated_category := await category_collection.find_one({"_id": oid})) is not None:
                return updated_category

    if (existing_category := await category_collection.find_one({"_id": oid})) is not None:
        return existing_category

    raise HTTPException(status_code=404, detail=f"Category {id} not found")

@router.delete("/{id}", response_description="Delete an category")
async def delete_category(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await category_collection.delete_one({"_id": oid})
    if delete_result.deleted_count == 1:
        return {"status": "success", "message": f"Category {id} deleted"}
    raise HTTPException(status_code=404, detail=f"Category {id} not found") 