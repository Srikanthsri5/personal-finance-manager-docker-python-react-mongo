from fastapi import APIRouter, Body
from fastapi.encoders import jsonable_encoder
from typing import List, Optional

from app.database import (
    expense_collection,
    expense_helper,
)
from app.models import (
    ExpenseModel,
    ResponseModel,
    ErrorResponseModel,
)
from bson.objectid import ObjectId

router = APIRouter()

@router.post("/", response_description="Expense data added into the database")
async def add_expense_data(expense: ExpenseModel = Body(...)):
    expense = jsonable_encoder(expense)
    new_expense = await expense_collection.insert_one(expense)
    created_expense = await expense_collection.find_one({"_id": new_expense.inserted_id})
    return expense_helper(created_expense)

@router.get("/", response_description="Expenses retrieved")
async def get_expenses(
    year: Optional[int] = None, 
    month: Optional[int] = None, 
    view: Optional[str] = "month"
):
    query = {}
    expenses = []
    
    if view == "month":
        # Handle month/year filtering properly based on how date is stored
        # Assuming date is stored as string 'YYYY-MM-DD'
        # Need a regex or date parsing logic. For simplicity, fetching all and filtering in memory first
        # OR better: use regex if string, or date range if datetime object.
        # Frontend sends string date
        import re
        if year and month:
            regex = f"^{year}-{month:02d}-"
            query = {"date": {"$regex": regex}}
    elif view == "all":
        query = {}

    async for expense in expense_collection.find(query):
        expenses.append(expense_helper(expense))
    return expenses

@router.delete("/{id}", response_description="Expense data deleted from the database")
async def delete_expense_data(id: str):
    delete_result = await expense_collection.delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return ResponseModel(data=[], message=f"Expense with ID {id} removed")

    return ErrorResponseModel(error="An error occurred", code=404, message=f"Expense with ID {id} doesn't exist")

@router.get("/export/{type}", response_description="Export expenses")
async def export_expenses(type: str):
    # Stub for now
    return {"message": f"Export {type} feature coming soon"}
