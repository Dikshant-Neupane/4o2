# Jana Sunuwaai - AI Pothole Detection & Reporting System

![Jana Sunuwaai](https://img.shields.io/badge/Status-Active-success)

## 📖 Overview
Jana Sunuwaai is an intelligent, full-stack web application designed to streamline the reporting, analysis, and management of road infrastructure issues, specifically focusing on potholes. By integrating cutting-edge **Computer Vision (YOLOv8)** and **Environmental Analysis heuristics (OpenCV)**, the system automatically detects potholes from user-submitted images, estimates their physical dimensions, evaluates surrounding environmental conditions, and predicts repair urgency and costs.

## ✨ Key Features
- **Seamless Issue Reporting:** An intuitive React frontend allowing citizens and administrative users to submit structural issue reports, pin exact geolocations via interactive maps (Leaflet), and upload images in real-time.
- **Advanced AI Detection:** Employs a YOLOv8 object detection model fine-tuned for recognizing potholes and predicting multi-class bounding boxes with high confidence.
- **Dynamic Environmental Context:** Leverages OpenCV algorithms to compute background visual heuristics—analyzing road materials (asphalt, dirt, concrete) and weather conditions (dry, wet, snowy)—to dynamically adjust the severity score.
- **Automated Cost & Volume Estimation:** Translates 2D bounding boxes into estimated pothole volumes, combining them with environmental constraints to project realistic repair budgets.
- **High-Performance Architecture:** Utilizes FastAPI for high-throughput REST APIs, completely decoupled from expensive ML inferences via **Celery & Redis** message queues.
- **Secure Access Control:** Fully integrated Email/Password Authentication Flow using JWT tokens and bcrypt encrypted credentials.

## 🎥 Project Media & Documentation

### 📺 System Demo
Check out the latest system walkthrough and AI pothole detection demo (Local File):
- **Video:** [4o2.mp4](./4o2.mp4)

### 📄 Assessment Reports
Detailed analysis and technical documentation of the system's performance:
- **PDF:** [Reports.pdf](file:///Reports.pdf)

## 🛠️ Technology Stack

### Frontend
- **Core:** React 18, Vite
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide-React
- **State Management:** Zustand
- **Maps:** Leaflet, React-Leaflet
- **Image Optimization:** Browser-Image-Compression

### Backend & AI
- **Framework:** FastAPI, Uvicorn
- **Database:** PostgreSQL (SQLAlchemy 2.0 ORM, Alembic Migrations)
- **Background Tasks:** Celery, Redis
- **Machine Learning:** PyTorch, Ultralytics (YOLOv8)
- **Computer Vision:** OpenCV, Pillow, Albumentations
- **Data & Auth:** Pydantic validation, Python-JOSE (JWT), Passlib (Bcrypt)

## 📂 Repository Structure
```text
4o2/
├── backend/               # Python/FastAPI Backend Services
│   ├── ai/                # YOLOv8 inference pipeline and OpenCV scripts
│   ├── app/               # FastAPI routes, Pydantic schemas, Auth logic
│   ├── alembic/           # PostgreSQL schema migration history
│   └── requirements.txt   # Python dependencies (Celery, FastAPI, Torch)
├── frontend/              # Node/React Frontend Application
│   ├── src/               # UI Components, Pages, State Store, API clients
│   └── package.json       # React dependencies and scripts
└── package.json           # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites
Ensure your development environment meets the following requirements:
- **Node.js** (v18+ recommended)
- **Python** (v3.10+)
- **PostgreSQL** running locally or a remote connection string
- **Redis** server running (for Celery workers)

### 1. Installation

Clone the repository and install all workspace dependencies (this cascades into both `frontend/` and `backend/` folders):
```bash
git clone <repository-url>
cd 4o2

# Install frontend and backend dependencies using the root script
npm run install:all
```

### 2. Configuration

Set up the environment variables for the backend. Create a `.env` file inside the `backend/` directory:

```env
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/jana_sunuwaai
SECRET_KEY=your_highly_secure_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379/0
```

Apply database migrations to bootstrap the PostgreSQL schema:
```bash
cd backend
alembic upgrade head
cd ..
```

### 3. Running the Platform

You can spin up both the Vite frontend server and the FastAPI backend concurrently from the root directory:

```bash
npm run dev
```

If you prefer to run the services individually:
- **Frontend only:** `npm run dev:frontend`
- **Backend only:** `npm run dev:backend`

*Note: For complete functionality involving AI inference, ensure that you launch a Celery worker in a separate terminal pointing to the `backend` directory:*
```bash
cd backend
celery -A app.core.celery_worker.celery_app worker --loglevel=info
```

## 📚 API Reference
With the backend running locally, you can access the automatically generated interactive API documentation provided by Swagger UI:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is proprietary and confidential. For licensing inquiries, please contact the maintainers.
