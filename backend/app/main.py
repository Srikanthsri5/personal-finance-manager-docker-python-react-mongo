from fastapi import FastAPI

app = FastAPI(title="Personal Finance Manager")

@app.get("/")
def read_root():
    return {"message": "Hello from Backend!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
