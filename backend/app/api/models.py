"""
AI model training & inference API endpoints.
"""

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.training_run import TrainingRun
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/models", tags=["Models"])


# ── Pydantic schemas ────────────────────────────────────────────
class TrainingRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    dataset_id: int
    model_type: str = "yolo"  # yolo | resnet | sklearn


from datetime import datetime

class TrainingRunResponse(BaseModel):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    id: int
    dataset_id: int
    model_type: str
    status: str
    metrics: Optional[str]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: Optional[datetime]


class InferenceRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_type: str = "yolo"
    image_path: str


class InferenceResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_type: str
    image_path: str
    predictions: list
    message: str


# ── Endpoints ───────────────────────────────────────────────────
@router.get("/training-runs", response_model=List[TrainingRunResponse])
def list_training_runs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all training runs."""
    runs = db.query(TrainingRun).order_by(TrainingRun.id.desc()).offset(skip).limit(limit).all()
    return runs


@router.post(
    "/train",
    response_model=TrainingRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_training(payload: TrainingRequest, db: Session = Depends(get_db)):
    """
    Start a new training run.

    In production this dispatches to a Celery worker.
    For now it creates the record and marks it as 'pending'.
    """
    service = ModelService(db)
    run = service.create_training_run(
        dataset_id=payload.dataset_id,
        model_type=payload.model_type,
    )
    return run


@router.get("/training-runs/{run_id}", response_model=TrainingRunResponse)
def get_training_run(run_id: int, db: Session = Depends(get_db)):
    """Get status of a specific training run."""
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Training run not found")
    return run


@router.post("/inference", response_model=InferenceResponse)
def run_inference(payload: InferenceRequest, db: Session = Depends(get_db)):
    """
    Run inference on a single image (placeholder).

    In Phase 2 this will load a trained model and return real predictions.
    """
    service = ModelService(db)
    result = service.run_inference(
        model_type=payload.model_type,
        image_path=payload.image_path,
    )
    return result
