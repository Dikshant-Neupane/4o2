"""
AI prediction & training API routes — Phase 2.

Endpoints:
    POST /api/ai/predict        — run inference on an uploaded image
    POST /api/ai/train          — kick off background training
    GET  /api/ai/model-status   — list all model versions
    GET  /api/ai/model-status/{version} — details for a specific version
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.inference import InferenceService
from app.services.model_versioning import ModelVersioning
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/ai", tags=["AI"])


# ── Pydantic Schemas ────────────────────────────────────────────
class PredictionBox(BaseModel):
    box: List[float]
    confidence: float
    class_id: int
    class_name: str
    severity: str

class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    label: int
    class_name: str
    confidence: float
    predictions: List[PredictionBox] = []
    model_version: Optional[int] = None
    image_path: Optional[str] = None


class TrainRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    dataset_id: int
    model_type: str = "yolov8n.pt"
    epochs: int = 10
    learning_rate: float = 0.001
    batch_size: int = 16


class TrainResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    id: int
    dataset_id: int
    model_type: str
    status: str
    message: str


class ModelVersionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    version: int
    model_file: str
    size_mb: float
    training_date: Optional[str] = None
    dataset: Optional[str] = None
    metrics: Optional[dict] = None


class ModelDetailResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    version: int
    model_file: str
    training_date: Optional[str] = None
    dataset: Optional[str] = None
    metrics: Optional[dict] = None
    hyperparameters: Optional[dict] = None
    model_architecture: Optional[str] = None


# ── Singleton inference service ─────────────────────────────────
_inference_service: Optional[InferenceService] = None


def get_inference_service() -> InferenceService:
    global _inference_service
    if _inference_service is None:
        _inference_service = InferenceService()
    return _inference_service


# ── Endpoints ───────────────────────────────────────────────────
@router.post("/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    version: Optional[int] = None,
):
    """
    Run pothole detection on an uploaded image.

    - **file**: Image file (JPEG, PNG, etc.)
    - **version**: Model version to use (optional, defaults to latest)
    """
    service = get_inference_service()

    try:
        contents = await file.read()
        result = service.predict_from_bytes(contents, version=version)
        return PredictResponse(**result)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post(
    "/train",
    response_model=TrainResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def start_training(payload: TrainRequest, db: Session = Depends(get_db)):
    """
    Start a new model training run (dispatched to background worker).

    - **dataset_id**: ID of a registered dataset
    - **model_type**: Model architecture (default: resnet18)
    - **epochs**: Number of training epochs
    - **learning_rate**: Learning rate
    - **batch_size**: Batch size
    """
    service = ModelService(db)
    try:
        run = service.create_training_run(
            dataset_id=payload.dataset_id,
            model_type=payload.model_type,
            epochs=payload.epochs,
            learning_rate=payload.learning_rate,
            batch_size=payload.batch_size,
        )
        return TrainResponse(
            id=run.id,
            dataset_id=run.dataset_id,
            model_type=run.model_type,
            status=run.status,
            message="Training job dispatched to background worker.",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/model-status", response_model=List[ModelVersionResponse])
def list_model_versions():
    """List all saved model versions with their metrics."""
    versioning = ModelVersioning()
    versions = versioning.list_versions()
    return versions


@router.get("/model-status/{version}", response_model=ModelDetailResponse)
def get_model_version(version: int):
    """Get detailed info about a specific model version."""
    versioning = ModelVersioning()
    try:
        metadata = versioning.load_metadata(version)
        return ModelDetailResponse(**metadata)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Model version {version} not found",
        )
