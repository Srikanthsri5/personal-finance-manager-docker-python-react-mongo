from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class ExpenseModel(BaseModel):
    title: str = Field(...)
    amount: float = Field(..., gt=0)
    category: str = Field(...)
    type: str = Field(...) # cash_in or cash_out
    date: str = Field(...)
    notes: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "title": "Grocery Shopping",
                "amount": 50.0,
                "category": "Food",
                "type": "cash_out",
                "date": "2023-10-27",
                "notes": "Weekly groceries"
            }
        }

class CategoryModel(BaseModel):
    name: str = Field(...)
    type: str = Field(...) # income or expense

    class Config:
        schema_extra = {
            "example": {
                "name": "Food",
                "type": "expense"
            }
        }

class ResponseModel(BaseModel):
    data: Optional[List[dict]]
    message: str

class ErrorResponseModel(BaseModel):
    error: str
    code: int
    message: str
