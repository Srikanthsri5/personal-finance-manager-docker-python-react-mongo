from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.expenses import router as ExpensesRouter
from app.routes.categories import router as CategoriesRouter

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ExpensesRouter, tags=["Expenses"], prefix="/api/expenses")
app.include_router(CategoriesRouter, tags=["Categories"], prefix="/api/categories")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to Personal Finance Manager API!"}
