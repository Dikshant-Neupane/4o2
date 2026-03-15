"""
Model evaluation for YOLOv8 pothole detection.

Runs the validation set through a trained model and produces:
    - Precision, Recall, F1-score
    - mAP@50, mAP@50-95
    - Confusion matrix (saved as PNG)
    - Per-class metrics JSON report
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional

import numpy as np
from loguru import logger

from ai.models.config import CLASS_NAMES, DEFAULT_PATHS, INFERENCE_CONFIG

class YOLOEvaluator:
    """
    Evaluates a trained YOLOv8 model on a dataset split.

    Usage::

        evaluator = YOLOEvaluator("runs/detect/pothole_model/weights/best.pt")
        metrics = evaluator.evaluate("datasets/yolo_potholes/data.yaml")
        evaluator.save_report("runs/detect/pothole_model/evaluation")
    """

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        import torch
        # PyTorch 2.6 security workaround for loading Ultralytics weights
        original_load = torch.load
        def safe_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = safe_load

        from ultralytics import YOLO
        self.model = YOLO(str(self.model_path))
        self._metrics: Optional[Dict] = None
        self._results = None

    # ── Public API ─────────────────────────────────────────────
    def evaluate(self, data_yaml: str = None, split: str = "test", imgsz: int = 640) -> Dict:
        """
        Run model validation and compute all metrics.

        Parameters
        ----------
        data_yaml : str
            Path to data.yaml config. Defaults to the one in DEFAULT_PATHS.
        split : str
            Dataset split to evaluate on ("val" or "test").
        imgsz : int
            Image size for evaluation.

        Returns
        -------
        dict
            Dictionary with precision, recall, f1, mAP50, mAP50_95, and per-class breakdown.
        """
        if data_yaml is None:
            data_yaml = os.path.join(DEFAULT_PATHS["yolo_dataset"], "data.yaml")

        if not Path(data_yaml).exists():
            raise FileNotFoundError(f"Data config not found: {data_yaml}")

        logger.info(f"Evaluating model on '{split}' split using {data_yaml}")
        self._results = self.model.val(
            data=str(Path(data_yaml).absolute()),
            split=split,
            imgsz=imgsz,
            augment=INFERENCE_CONFIG.get("augment", False),
            verbose=True,
        )

        # Extract metrics from Results object
        box = self._results.box
        precision = float(box.p.mean()) if len(box.p) > 0 else 0.0
        recall = float(box.r.mean()) if len(box.r) > 0 else 0.0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        self._metrics = {
            "precision":  round(precision, 4),
            "recall":     round(recall, 4),
            "f1_score":   round(f1, 4),
            "mAP50":      round(float(box.map50), 4),
            "mAP50_95":   round(float(box.map), 4),
            "per_class":  self._per_class_metrics(box),
        }

        logger.info(f"Evaluation results: P={self._metrics['precision']}, "
                     f"R={self._metrics['recall']}, F1={self._metrics['f1_score']}, "
                     f"mAP50={self._metrics['mAP50']}, mAP50-95={self._metrics['mAP50_95']}")

        return self._metrics

    def plot_confusion_matrix(self, save_dir: str = None) -> Optional[str]:
        """
        Generate and save a confusion matrix plot.

        Returns the path to the saved PNG, or None if plotting is unavailable.
        """
        if self._results is None:
            raise RuntimeError("Run evaluate() before plotting confusion matrix.")

        try:
            import matplotlib
            matplotlib.use("Agg")  # Non-interactive backend
            import matplotlib.pyplot as plt
            import seaborn as sns
        except ImportError:
            logger.warning("matplotlib/seaborn not installed — skipping confusion matrix plot")
            return None

        if save_dir is None:
            save_dir = str(self.model_path.parent.parent / "evaluation")
        os.makedirs(save_dir, exist_ok=True)

        # Try to extract confusion matrix from YOLO results
        try:
            cm = self._results.confusion_matrix
            matrix = cm.matrix  # numpy array
            class_names = list(CLASS_NAMES.values()) + ["background"]

            fig, ax = plt.subplots(figsize=(8, 6))
            sns.heatmap(
                matrix,
                annot=True,
                fmt=".0f",
                cmap="Blues",
                xticklabels=class_names[:matrix.shape[1]],
                yticklabels=class_names[:matrix.shape[0]],
                ax=ax,
            )
            ax.set_xlabel("Predicted")
            ax.set_ylabel("Actual")
            ax.set_title("Pothole Detection — Confusion Matrix")

            out_path = os.path.join(save_dir, "confusion_matrix.png")
            fig.savefig(out_path, dpi=150, bbox_inches="tight")
            plt.close(fig)
            logger.info(f"Confusion matrix saved to {out_path}")
            return out_path

        except Exception as e:
            logger.warning(f"Could not generate confusion matrix: {e}")
            return None

    def save_report(self, save_dir: str = None) -> str:
        """
        Save the full evaluation report as a JSON file.

        Returns
        -------
        str
            Path to the saved JSON report.
        """
        if self._metrics is None:
            raise RuntimeError("Run evaluate() before saving report.")

        if save_dir is None:
            save_dir = str(self.model_path.parent.parent / "evaluation")
        os.makedirs(save_dir, exist_ok=True)

        report_path = os.path.join(save_dir, "evaluation_report.json")
        with open(report_path, "w") as f:
            json.dump(self._metrics, f, indent=2, default=str)

        logger.info(f"Evaluation report saved to {report_path}")
        return report_path

    # ── Internals ──────────────────────────────────────────────
    @staticmethod
    def _per_class_metrics(box) -> list:
        """Extract per-class precision, recall, and AP metrics."""
        per_class = []
        num_classes = len(box.p) if hasattr(box, "p") else 0
        for i in range(num_classes):
            cls_name = CLASS_NAMES.get(i, f"class_{i}")
            per_class.append({
                "class_id":   i,
                "class_name": cls_name,
                "precision":  round(float(box.p[i]), 4),
                "recall":     round(float(box.r[i]), 4),
                "ap50":       round(float(box.ap50[i]), 4) if hasattr(box, "ap50") else None,
            })
        return per_class


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m ai.evaluate <model_path> [data_yaml]")
        sys.exit(1)

    model = sys.argv[1]
    data = sys.argv[2] if len(sys.argv) > 2 else None

    evaluator = YOLOEvaluator(model)
    metrics = evaluator.evaluate(data)
    evaluator.plot_confusion_matrix()
    report = evaluator.save_report()

    print(f"\n{'='*50}")
    print(f"Evaluation Report saved to: {report}")
    print(f"Metrics: {json.dumps(metrics, indent=2)}")
