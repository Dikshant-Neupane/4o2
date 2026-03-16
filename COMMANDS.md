# 🚀 Project Command Cheat Sheet

Quick reference for the most common commands used in this project on Windows.

## 🐍 Backend (Python / FastAPI)

### Activate Virtual Environment
```powershell
# From project root
.\backend\venv\Scripts\activate

# If already inside /backend folder
.\venv\Scripts\activate
```

### Install Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### Start Backend Server
```powershell
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Migrations
```powershell
cd backend
alembic upgrade head
```

---

## ⚛️ Frontend (React / Vite)

### Install Dependencies
```powershell
cd frontend
npm install
```

### Start Development Server
```powershell
cd frontend
npm run dev
```

---

## ⚙️ Background Tasks (Celery & Redis)

### Start Celery Worker
*Note: Run this in a separate terminal with the venv activated.*
```powershell
cd backend
celery -A app.core.celery_worker.celery_app worker --loglevel=info
```

---

## 🛠️ Root Workspace Commands
*Managed via the root `package.json` scripts.*

### Install Everything
```powershell
npm run install:all
```

### Run Frontend & Backend Concurrently
```powershell
npm run dev
```
