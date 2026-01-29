from fastapi import APIRouter, Body, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import pandas as pd
import io

# ReportLab imports for PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from ..models import ExpenseModel, ExpenseCreate, ExpenseUpdate
from ..database import expense_collection

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

def get_date_filter(view: str):
    today = datetime.now()
    if view == 'daily':
        start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end = today.replace(hour=23, minute=59, second=59, microsecond=999999)
        return {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    elif view == 'weekly':
        start = today - timedelta(days=today.weekday()) # Monday
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        return {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    elif view == 'monthly':
        start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of month calculation
        next_month = today.replace(day=28) + timedelta(days=4)
        end = next_month - timedelta(days=next_month.day)
        end = end.replace(hour=23, minute=59, second=59)
        return {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    elif view == 'yearly':
        start = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = today.replace(month=12, day=31, hour=23, minute=59, second=59)
        return {"date": {"$gte": start.isoformat(), "$lte": end.isoformat()}}
    return {}

@router.post("/", response_description="Add new expense", response_model=ExpenseModel)
async def create_expense(expense: ExpenseCreate = Body(...)):
    expense_dict = jsonable_encoder(expense)
    new_expense = await expense_collection.insert_one(expense_dict)
    created_expense = await expense_collection.find_one({"_id": new_expense.inserted_id})
    return created_expense

@router.get("/", response_description="List expenses", response_model=List[ExpenseModel])
async def list_expenses(view: Optional[str] = Query('all', enum=['all', 'daily', 'weekly', 'monthly', 'yearly'])):
    filter_query = get_date_filter(view)
    expenses = await expense_collection.find(filter_query).to_list(1000)
    return expenses

@router.get("/export/excel", response_description="Export expenses to Excel")
async def export_excel(view: Optional[str] = Query('all', enum=['all', 'daily', 'weekly', 'monthly', 'yearly'])):
    filter_query = get_date_filter(view)
    expenses = await expense_collection.find(filter_query).to_list(1000)
    
    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found to export")
    
    # Flatten object id
    data = []
    for exp in expenses:
        exp['id'] = str(exp.get('_id'))
        del exp['_id']
        data.append(exp)

    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Expenses')
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="expenses_{view}.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.get("/export/pdf", response_description="Export expenses to PDF")
async def export_pdf(view: Optional[str] = Query('all', enum=['all', 'daily', 'weekly', 'monthly', 'yearly'])):
    filter_query = get_date_filter(view)
    expenses = await expense_collection.find(filter_query).to_list(1000)

    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found to export")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"Expense Report - {view.capitalize()}", styles['Title']))

    # Table Data
    data = [['Date', 'Title', 'Category', 'Amount', 'Notes']]
    total_amount = 0.0
    for exp in expenses:
        amount = exp.get('amount', 0)
        total_amount += amount
        date_str = exp.get('date', '')
        if 'T' in date_str:
            date_str = date_str.split('T')[0]
            
        data.append([
            date_str,
            exp.get('title', ''),
            exp.get('category', ''),
            f"${amount:.2f}",
            exp.get('notes', '')
        ])
    
    data.append(['', '', 'Total', f"${total_amount:.2f}", ''])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    headers = {
        'Content-Disposition': f'attachment; filename="expenses_{view}.pdf"'
    }
    return StreamingResponse(buffer, headers=headers, media_type='application/pdf')

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
