from fastapi import FastAPI
from app.db_conn import client

app = FastAPI()

@app.get("/")
def read_root():
    return {"Finance Tracker": "Cool features coming soon"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

