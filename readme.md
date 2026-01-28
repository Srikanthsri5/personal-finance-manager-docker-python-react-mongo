# Personal Finance Manager 💰

A full-stack personal finance tracker built to learn **Docker, FastAPI, React, and MongoDB**.

## 🚀 Quick Start

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <your-repo-url>
    cd personal-finance-manager
    ```

### Option 1: Run with Docker Compose (Recommended)
    ```bash
    docker-compose up --build
    ```

### Option 2: Run Locally (Manual Setup)

**Prerequisites:**
*   Node.js & npm
*   Python 3.10+
*   MongoDB (running locally on port 27017)

**1. Backend Setup:**
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate
pip install -r requirements.txt
# Run Server
uvicorn app.main:app --reload
```

**2. Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

3.  **Access the Application**:
    *   **Frontend**: [http://localhost:5173](http://localhost:5173)
    *   **Backend API**: [http://localhost:8000](http://localhost:8000)
    *   **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🏗️ Tech Stack

| Service | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Fast, modern UI library. |
| **Backend** | FastAPI (Python) | High-performance async API. |
| **Database** | MongoDB | NoSQL database for flexible data schemas. |
| **Infrastructure** | Docker | Containerization for consistent environments. |

## 📅 Roadmap

See [Project Roadmap](file:///home/srikanth/.gemini/antigravity/brain/12718863-7015-41ff-b117-255072c09248/project_roadmap.md) for detailed implementation phases.

## 🛠️ Project Structure

```text
personal-finance-manager/
├── backend/            # FastAPI Application
│   ├── app/            # Source code
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # React Application
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml  # Orchestration
└── README.md           # This file
```
