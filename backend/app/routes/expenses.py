from fastapi import APIRouter, Body, HTTPException, status
from fastapi.encoders import jsonable_encoder
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

from ..models import ExpenseModel, ExpenseCreate, ExpenseUpdate
from ..database import expense_collection

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

@router.post("/", response_description="Add new expense", response_model=ExpenseModel)
async def create_expense(expense: ExpenseCreate = Body(...)):
    expense_dict = jsonable_encoder(expense)
    new_expense = await expense_collection.insert_one(expense_dict)
    created_expense = await expense_collection.find_one({"_id": new_expense.inserted_id})
    return created_expense

@router.get("/", response_description="List all expenses", response_model=List[ExpenseModel])
async def list_expenses():
    expenses = await expense_collection.find().to_list(1000)
    return expenses

@router.get("/{id}", response_description="Get a single expense", response_model=ExpenseModel)
async def show_expense(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if (expense := await expense_collection.find_one({"_id": oid})) is not None:
        return expense
    raise HTTPException(status_code=404, detail=f"Expense {id} not found")

@router.put("/{id}", response_description="Update an expense", response_model=ExpenseModel)
async def update_expense(id: str, expense: ExpenseUpdate = Body(...)):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    expense_dict = {k: v for k, v in expense.model_dump(exclude_unset=True).items()}

    if len(expense_dict) >= 1:
        update_result = await expense_collection.update_one({"_id": oid}, {"$set": expense_dict})
        if update_result.modified_count == 1:
            if (updated_expense := await expense_collection.find_one({"_id": oid})) is not None:
                return updated_expense

    if (existing_expense := await expense_collection.find_one({"_id": oid})) is not None:
        return existing_expense

    raise HTTPException(status_code=404, detail=f"Expense {id} not found")

@router.delete("/{id}", response_description="Delete an expense")
async def delete_expense(id: str):
    try:
        oid = ObjectId(id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await expense_collection.delete_one({"_id": oid})
    if delete_result.deleted_count == 1:
        return {"status": "success", "message": f"Expense {id} deleted"}
    raise HTTPException(status_code=404, detail=f"Expense {id} not found")
