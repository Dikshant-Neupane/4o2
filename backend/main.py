"""
AI Backend — FastAPI Application Entry Point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.logging import setup_logging

# ── API routers ─────────────────────────────────────────────────
from app.api.health import router as health_router
from app.api.datasets import router as datasets_router
from app.api.models import router as models_router
from app.api.ai_routes import router as ai_router
from app.api.auth import router as auth_router
from app.api.dept_routes import router as dept_router
from app.api.report_routes import router as report_router
from app.api.ws_routes import router as ws_router


# ── Lifespan (startup / shutdown) ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise resources on startup, clean up on shutdown."""
    # Startup
    setup_logging()
    logger.info("Starting {} v{}", settings.app_name, settings.app_version)
    init_db()
    logger.info("Database tables created / verified")
    print("[PHASE 2] Tables created in civiceye.db")

    # Phase 3: seed departments
    from app.utils.seed import seed_departments
    db = SessionLocal()
    try:
        seed_departments(db)
    finally:
        db.close()

    print("[PHASE 10] All routes registered: auth, departments, reports, websocket")
    yield
    # Shutdown
    logger.info("Shutting down …")


# ── FastAPI app ─────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered pothole detection backend — Phase 2 (ML Pipeline)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        *settings.cors_origin_list,
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Serve uploaded media files ──────────────────────────────────
import os
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "media", "uploads")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "media")), name="media")

# ── Register routers ───────────────────────────────────────────
app.include_router(health_router)
app.include_router(datasets_router)
app.include_router(models_router)
app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(dept_router)
app.include_router(report_router)
app.include_router(ws_router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint — basic welcome message."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
    }
