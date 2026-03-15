"""
Inference service — load trained models and run predictions.
"""

from pathlib import Path
from typing import Any, Optional

import torch
from loguru import logger
from app.core.config import settings
from app.services.model_versioning import ModelVersioning





class InferenceService:
    """
    Load a trained model and run predictions on images.

    Caches the loaded model to avoid reloading on every request.
    """

    CLASS_NAMES = ["normal", "pothole"]

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = model_dir or str(settings.model_path)
        self.versioning = ModelVersioning(self.model_dir)

        # Cached model state
        self._model = None
        self._loaded_version: Optional[int] = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self, version: Optional[int] = None) -> None:
        """
        Load a specific YOLO model version, or the latest default.
        """
        if version is None:
            model_path = Path("ai/weights/pothole_best.pt")
            if not model_path.exists():
                raise FileNotFoundError("Default YOLO model not found in ai/weights/")
        else:
            model_path = Path(self.model_dir) / f"model_v{version}.pt"
            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")

        # Skip if already loaded
        if self._model is not None and self._loaded_version == version:
            return

        from ai.inference import YOLOInference
        self._model = YOLOInference(str(model_path))
        self._loaded_version = version
        logger.info("Inference model loaded — YOLOv8 v{} on {}", self._loaded_version, self.device)

    # ── Prediction ──────────────────────────────────────────────
    def predict(
        self,
        image_path: str,
        version: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Run inference on a single image.

        Args:
            image_path: Path to the image file.
            version: Model version to use (None = latest).

        Returns:
            Dict with label, confidence, class_name, and version.
        """
        self.load_model(version)

        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        # Preprocessing and inference is handled by YOLO
        predictions = self._model.predict(str(path))

        # ── Format Response for FastAPI ──
        if predictions:
            # If potholes detected, label the image as 1 (pothole), confidence is max of boxes
            best_pred = max(predictions, key=lambda x: x['confidence'])
            label = 1
            conf = best_pred['confidence']
            class_name = "pothole"
        else:
            # Normal road
            label = 0
            conf = 1.0
            class_name = "normal"

        logger.info(
            "YOLO Prediction: {} objects found for {}",
            len(predictions), path.name,
        )

        return {
            "label": label,
            "class_name": class_name,
            "confidence": conf,
            "predictions": predictions,  # List of PredictionBox dictionaries
            "model_version": self._loaded_version,
            "image_path": str(path),
        }

    def predict_from_bytes(
        self,
        image_bytes: bytes,
        version: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Run inference from raw image bytes (e.g., from file upload).

        Returns:
            Dict with label, confidence, class_name, and version.
        """
        import tempfile
        import os

        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
        with open(fd, "wb") as f:
            f.write(image_bytes)
            
        try:
            res = self.predict(temp_path, version)
            # Hide the temp path from the user response
            res.pop("image_path", None)
            return res
        finally:
            os.remove(temp_path)

    # ── Status ──────────────────────────────────────────────────
    def get_status(self) -> dict[str, Any]:
        """Return current inference service status."""
        return {
            "model_loaded": self._model is not None,
            "loaded_version": self._loaded_version,
            "device": self.device,
            "available_versions": [
                v["version"] for v in self.versioning.list_versions()
            ],
        }
