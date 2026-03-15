"""
Model service — orchestrates model training and inference (Phase 2).
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset
from app.models.training_run import TrainingRun
from app.services.inference import InferenceService
from app.services.model_versioning import ModelVersioning


class ModelService:
    """Orchestration layer for AI model operations."""

    def __init__(self, db: Session):
        self.db = db

    # ── Training ────────────────────────────────────────────────
    def create_training_run(
        self,
        dataset_id: int,
        model_type: str,
        epochs: int = 10,
        learning_rate: float = 1e-3,
        batch_size: int = 16,
    ) -> TrainingRun:
        """Create a training run record and dispatch to Celery worker."""
        # Verify dataset exists
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise ValueError(f"Dataset with id={dataset_id} not found")

        run = TrainingRun(
            dataset_id=dataset_id,
            model_type=model_type,
            status="pending",
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)

        logger.info(
            "Created training run #{} (model={}, dataset={})",
            run.id,
            model_type,
            dataset.name,
        )

        # Dispatch to Celery worker
        try:
            from app.workers.tasks import train_model_task
            train_model_task.delay(
                run.id,
                epochs=epochs,
                learning_rate=learning_rate,
                batch_size=batch_size,
            )
            logger.info("Training run #{} dispatched to Celery", run.id)
        except Exception as e:
            logger.warning(
                "Could not dispatch to Celery (worker may be offline): {}. "
                "Run will stay in 'pending' status.",
                e,
            )

        return run

    def update_training_status(
        self,
        run_id: int,
        status: str,
        metrics: Optional[dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ) -> TrainingRun:
        """Update a training run's status and optional metrics."""
        run = self.db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            raise ValueError(f"Training run #{run_id} not found")

        run.status = status
        if metrics:
            run.metrics = json.dumps(metrics)
        if error_message:
            run.error_message = error_message
        if status == "running" and not run.started_at:
            run.started_at = datetime.utcnow()
        if status in ("completed", "failed"):
            run.completed_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(run)
        logger.info("Training run #{} → status={}", run_id, status)
        return run

    # ── Inference ───────────────────────────────────────────────
    def run_inference(
        self,
        model_type: str,
        image_path: str,
    ) -> dict[str, Any]:
        """
        Run inference on a single image using the latest trained model.
        """
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        try:
            service = InferenceService()
            prediction = service.predict(str(path))
            return {
                "model_type": model_type,
                "image_path": str(path),
                "predictions": prediction["predictions"],
                "message": f"Inference completed using model v{prediction['model_version']}",
            }
        except FileNotFoundError:
            # No trained model available yet
            return {
                "model_type": model_type,
                "image_path": str(path),
                "predictions": [],
                "message": "No trained model found — please train a model first.",
            }

    # ── Model Versions ──────────────────────────────────────────
    def get_model_versions(self) -> list:
        """List all saved model versions with metadata."""
        versioning = ModelVersioning()
        return versioning.list_versions()

    # ── Utilities ───────────────────────────────────────────────
    def list_saved_models(self) -> list:
        """List model files in the models directory."""
        model_dir = settings.model_path
        if not model_dir.exists():
            return []
        return [
            {"name": f.name, "size_mb": round(f.stat().st_size / 1e6, 2)}
            for f in model_dir.iterdir()
            if f.is_file() and f.suffix in (".pt", ".pth", ".pkl", ".joblib")
        ]
