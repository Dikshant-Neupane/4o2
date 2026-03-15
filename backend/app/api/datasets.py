"""
Dataset management API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.dataset import Dataset
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/api/v1/datasets", tags=["Datasets"])


# ── Pydantic schemas ────────────────────────────────────────────
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    file_path: str
    file_type: str = "images"


from datetime import datetime

class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    file_path: str
    file_type: str
    num_samples: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class DatasetScanResponse(BaseModel):
    name: str
    file_path: str
    file_type: str
    num_samples: int


# ── Endpoints ───────────────────────────────────────────────────
@router.get("/", response_model=list[DatasetResponse])
def list_datasets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all registered datasets."""
    datasets = db.query(Dataset).offset(skip).limit(limit).all()
    return datasets


# NOTE: /scan/available MUST come before /{dataset_id} or FastAPI
# treats "scan" as a dataset_id and returns a 422 validation error.
@router.get("/scan/available", response_model=list[DatasetScanResponse])
def scan_datasets(db: Session = Depends(get_db)):
    """Scan the data directory for available datasets."""
    service = DatasetService(db)
    return service.scan_data_directory()


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Get a single dataset by ID."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.post("/", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def create_dataset(payload: DatasetCreate, db: Session = Depends(get_db)):
    """Register a new dataset (validates the path exists)."""
    service = DatasetService(db)
    dataset = service.register_dataset(
        name=payload.name,
        description=payload.description,
        file_path=payload.file_path,
        file_type=payload.file_type,
    )
    return dataset


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset record (does NOT delete files)."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    db.commit()
