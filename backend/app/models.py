from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]

class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    date: datetime = Field(default_factory=datetime.now)
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None

class ExpenseModel(ExpenseBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "title": "Groceries",
                "amount": 50.25,
                "category": "Food",
                "date": "2023-10-01T12:00:00",
                "notes": "Weekly shopping"
            }
        }
    )

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    budget: Optional[float] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    budget: Optional[float] = None

class CategoryModel(CategoryBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "name": "Groceries",
                "type": "expense",
                "budget": 500.00
            }
        }
    )
