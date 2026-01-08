# Personal Finance Manager 💰

A full-stack personal project to **learn Docker, Python (FastAPI), React, MongoDB (NoSQL), and Deployment** by building a real-world **Personal Finance Management** system.

This project focuses on **learning-by-doing**.  
Only the starter structure is defined — implementation is intentionally left to be built step by step.

---

## 🎯 Project Goal

Build a system to:
- Track **monthly cash inflows & outflows**
- Categorize expenses (food, rent, travel, etc.)
- View monthly summaries
- Export finance data (CSV / Excel / PDF)
- Deploy the full stack using Docker

---

## 🧠 Tech Stack (Learning Focus)

| Layer        | Technology |
|--------------|------------|
| Frontend     | React |
| Backend      | Python + FastAPI |
| Database     | MongoDB (NoSQL) |
| Containers   | Docker & Docker Compose |
| Deployment   | Cloud VM (AWS / Azure / GCP) |

---

## 📁 Project Structure

```text
personal-finance-manager/
│
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config/          # Env & settings
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helpers
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/        # API calls
│   │   └── App.js
│   │
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── database/
│   └── init.js              # MongoDB init scripts (optional)
│
├── docker-compose.yml
├── .gitignore
└── README.md
