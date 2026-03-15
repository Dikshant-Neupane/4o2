"""
YOLOv8 training script for pothole detection.

Handles the complete training pipeline:
    1. Load and validate dataset configuration
    2. Initialise YOLOv8 model (nano by default)
    3. Train with configurable hyperparameters and augmentation
    4. Evaluate on the validation set
    5. Copy best weights to ai/weights/ directory
"""

import os
import shutil
from pathlib import Path

from loguru import logger

from ai.models.config import (
    TRAIN_CONFIG,
    AUGMENTATION_CONFIG,
    DEFAULT_PATHS,
)


class YOLOTrainer:
    """
    Trains a YOLOv8 model for pothole object detection.

    Usage::

        trainer = YOLOTrainer()
        model_path, metrics = trainer.train(epochs=50)
    """

    def __init__(
        self,
        data_yaml_path: str = None,
        model_type: str = None,
        project_dir: str = None,
    ):
        self.data_yaml_path = Path(
            data_yaml_path or os.path.join(DEFAULT_PATHS["yolo_dataset"], "data.yaml")
        )
        self.model_type = model_type or TRAIN_CONFIG["model_type"]
        self.project_dir = project_dir or TRAIN_CONFIG["project_dir"]

        if not self.data_yaml_path.exists():
            raise FileNotFoundError(
                f"YAML config not found at {self.data_yaml_path}. "
                "Run dataset_loader.py first."
            )

    def train(
        self,
        epochs: int = None,
        batch_size: int = None,
        imgsz: int = None,
        name: str = None,
        patience: int = None,
        lr0: float = None,
    ):
        """
        Execute the YOLO training loop.

        Parameters
        ----------
        epochs : int
            Number of training epochs.
        batch_size : int
            Batch size for training.
        imgsz : int
            Input image size.
        name : str
            Run name (sub-directory in project_dir).
        patience : int
            Early-stopping patience.
        lr0 : float
            Initial learning rate.

        Returns
        -------
        (Path, dict)
            Path to the best model weights and a metrics dictionary.
        """
        epochs = epochs or TRAIN_CONFIG["epochs"]
        batch_size = batch_size or TRAIN_CONFIG["batch_size"]
        imgsz = imgsz or TRAIN_CONFIG["imgsz"]
        name = name or TRAIN_CONFIG["run_name"]
        patience = patience or TRAIN_CONFIG["patience"]
        lr0 = lr0 or TRAIN_CONFIG["lr0"]

        logger.info(f"Initializing YOLO trainer with base model: {self.model_type}")

        import torch
        # PyTorch 2.6 security workaround for loading Ultralytics weights
        original_load = torch.load
        def safe_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = safe_load

        from ultralytics import YOLO
        model = YOLO(self.model_type)

        logger.info(
            f"Starting training on {self.data_yaml_path} | "
            f"epochs={epochs}, batch={batch_size}, imgsz={imgsz}, lr0={lr0}"
        )

        # ── Data augmentation parameters (passed to YOLO .train()) ──
        aug = AUGMENTATION_CONFIG
        results = model.train(
            data=str(self.data_yaml_path.absolute()),
            epochs=epochs,
            batch=batch_size,
            imgsz=imgsz,
            project=self.project_dir,
            name=name,
            exist_ok=True,
            verbose=True,
            patience=patience,
            lr0=lr0,
            optimizer=TRAIN_CONFIG.get("optimizer", "auto"),
            weight_decay=TRAIN_CONFIG.get("weight_decay", 0.0005),
            close_mosaic=TRAIN_CONFIG.get("close_mosaic", 5),
            cos_lr=TRAIN_CONFIG.get("cos_lr", True),
            mixup=TRAIN_CONFIG.get("mixup", 0.15),
            mosaic=TRAIN_CONFIG.get("mosaic", 1.0),
            label_smoothing=TRAIN_CONFIG.get("label_smoothing", 0.1),
            warmup_epochs=TRAIN_CONFIG.get("warmup_epochs", 3.0),
            freeze=10,  # Freeze backbone for ultra-fast transfer learning
            # Augmentation toggles forwarded to YOLO engine
            flipud=aug["vertical_flip_p"],
            fliplr=aug["horizontal_flip_p"],
            degrees=aug["rotation_limit"],
            scale=aug["scale_limit"],
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=aug["brightness_limit"],
        )

        # ── Extract metrics ──────────────────────────────────────
        precision = float(results.box.p.mean()) if len(results.box.p) > 0 else 0.0
        recall = float(results.box.r.mean()) if len(results.box.r) > 0 else 0.0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        metrics = {
            "mAP50":      round(float(results.box.map50), 4),
            "mAP50-95":   round(float(results.box.map), 4),
            "precision":  round(precision, 4),
            "recall":     round(recall, 4),
            "f1_score":   round(f1, 4),
        }

        logger.info(f"Training complete! Metrics: {metrics}")

        # ── Best model path ──────────────────────────────────────
        best_model_path = Path(self.project_dir) / name / "weights" / "best.pt"
        logger.info(f"Best model saved to: {best_model_path}")

        # ── Copy best weights to ai/weights/ ─────────────────────
        self._copy_best_weights(best_model_path)

        return best_model_path, metrics

    @staticmethod
    def _copy_best_weights(best_model_path: Path):
        """Copy the best model to the consolidated weights directory."""
        weights_dir = Path(DEFAULT_PATHS["weights_dir"])
        weights_dir.mkdir(parents=True, exist_ok=True)

        dest = weights_dir / "pothole_best.pt"
        if best_model_path.exists():
            shutil.copy2(str(best_model_path), str(dest))
            logger.info(f"Best weights also saved to: {dest}")


if __name__ == "__main__":
    trainer = YOLOTrainer()
    model_path, metrics = trainer.train(epochs=1, imgsz=224)
    print(f"\nFinal Model Weights: {model_path}")
    print(f"Final Metrics: {metrics}")
