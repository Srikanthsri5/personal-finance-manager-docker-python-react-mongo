# Personal Finance Manager

A comprehensive, full-stack Personal Finance Manager application built using a React (Vite) frontend and a Python (FastAPI) backend, with a MongoDB database for persistence.

## 🚀 Features (Planned & Expected)

- **Expense Tracking:** Easily log, categorize, and track daily expenses.
- **Dynamic Dashboard:** Visual representation of spending habits and ongoing expenses.
- **Categorization:** Create custom spending categories to accurately track where your money goes.
- **Budgeting & Filtering:** Filter expenses by date, amount, or specific category to stay on top of your financial goals.
- **Responsive UI:** A modern, mobile-friendly interface built using standard React components.
- **Robust API:** Fast, type-checked backend routes handled by FastAPI.
- **Persistent Data:** Secure data storage using MongoDB, integrated with asynchronous drivers (Motor).

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, Node.js
- **Backend:** Python 3.10+, FastAPI, Uvicorn
- **Database:** MongoDB
- **Containerization (Optional):** Docker, Docker Compose

---

## 🏃 Getting Started (Running Locally Without Docker)

To run the application natively on your machine, you'll need two separate terminal windows for the frontend and the backend.

### 1. Database Requirement
Ensure you have a MongoDB instance running locally (typically on default port `27017`), or provide a Remote MongoDB URI.

### 2. Run the Backend (Python/FastAPI)
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. (Optional) Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Uvicorn server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The API will be accessible at http://localhost:8000*

### 3. Run the Frontend (React/Vite)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the necessary Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React application will be accessible at http://localhost:5173*

---

## 🐳 Running with Docker (Recommended for Production/Ease)

If you prefer to run the entire stack (Frontend, Backend, and MongoDB) all at once without installing Python/Node dependencies locally, you can use Docker.

*(Note: Ensure Docker and Docker Compose are installed on your machine).*

1. From the root directory of this project, build and start the containers using:
   ```bash
   docker compose up -d --build
   ```
2. To view the logs and make sure everything is running smoothly:
   ```bash
   docker compose logs -f
   ```
3. **Accessing the App:**
   - The Frontend (UI) will be mapped to a specific port on your localhost depending on the `docker-compose.yml` config (usually `http://localhost:5173` or `http://localhost:80`).
   - The Backend API will be available at `http://localhost:8000`.
   - The MongoDB database will be running inside its container on port `27017`.

4. To stop the application and spin down the containers:
   ```bash
   docker compose down
   ```
