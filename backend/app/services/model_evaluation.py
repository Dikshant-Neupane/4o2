"""
Model evaluation service — metrics computation, confusion matrix, and plot generation.
"""

from pathlib import Path
from typing import Any, Optional

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server use

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
from loguru import logger
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from torch.utils.data import DataLoader


class ModelEvaluator:
    """Evaluate a trained PyTorch model and generate metrics/plots."""

    CLASS_NAMES = ["normal", "pothole"]

    def __init__(self, model: torch.nn.Module, device: Optional[str] = None):
        self.model = model
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.model.eval()

        # Stores from last evaluation
        self.all_preds: list[int] = []
        self.all_labels: list[int] = []
        self.all_probs: list[float] = []

    # ── Core Evaluation ─────────────────────────────────────────
    def evaluate(self, dataloader: DataLoader) -> dict[str, Any]:
        """
        Run the model on a DataLoader and compute all metrics.

        Returns:
            Dict with accuracy, precision, recall, f1, confusion_matrix,
            and per-class classification report.
        """
        self.all_preds = []
        self.all_labels = []
        self.all_probs = []

        with torch.no_grad():
            for images, labels in dataloader:
                images = images.to(self.device)
                outputs = self.model(images)
                probabilities = torch.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs, 1)

                self.all_preds.extend(predicted.cpu().numpy().tolist())
                self.all_labels.extend(labels.numpy().tolist())
                self.all_probs.extend(
                    probabilities[:, 1].cpu().numpy().tolist()
                )

        metrics = self._compute_metrics()
        logger.info(
            "Evaluation — Acc: {:.4f}, P: {:.4f}, R: {:.4f}, F1: {:.4f}",
            metrics["accuracy"],
            metrics["precision"],
            metrics["recall"],
            metrics["f1_score"],
        )
        return metrics

    def _compute_metrics(self) -> dict[str, Any]:
        """Compute classification metrics from stored predictions."""
        y_true = self.all_labels
        y_pred = self.all_preds

        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, average="binary", zero_division=0)
        rec = recall_score(y_true, y_pred, average="binary", zero_division=0)
        f1 = f1_score(y_true, y_pred, average="binary", zero_division=0)
        cm = confusion_matrix(y_true, y_pred)

        return {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm.tolist(),
            "total_samples": len(y_true),
        }

    # ── Plot Generation ─────────────────────────────────────────
    def plot_confusion_matrix(self, save_dir: str) -> str:
        """Generate and save a confusion matrix heatmap."""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        filepath = save_path / "confusion_matrix.png"

        cm = confusion_matrix(self.all_labels, self.all_preds)

        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=self.CLASS_NAMES,
            yticklabels=self.CLASS_NAMES,
            ax=ax,
            cbar_kws={"label": "Count"},
        )
        ax.set_xlabel("Predicted Label", fontsize=12)
        ax.set_ylabel("True Label", fontsize=12)
        ax.set_title("Confusion Matrix — Pothole Detection", fontsize=14)
        plt.tight_layout()
        fig.savefig(str(filepath), dpi=150)
        plt.close(fig)

        logger.info("Confusion matrix saved → {}", filepath)
        return str(filepath)

    def plot_training_history(
        self,
        train_losses: list[float],
        val_losses: list[float],
        train_accs: list[float],
        val_accs: list[float],
        save_dir: str,
    ) -> str:
        """Generate and save training history plots (loss + accuracy curves)."""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        filepath = save_path / "training_history.png"

        epochs = range(1, len(train_losses) + 1)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        # Loss curve
        ax1.plot(epochs, train_losses, "b-o", label="Train Loss", markersize=4)
        ax1.plot(epochs, val_losses, "r-o", label="Val Loss", markersize=4)
        ax1.set_xlabel("Epoch")
        ax1.set_ylabel("Loss")
        ax1.set_title("Training & Validation Loss")
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Accuracy curve
        ax2.plot(epochs, train_accs, "b-o", label="Train Accuracy", markersize=4)
        ax2.plot(epochs, val_accs, "r-o", label="Val Accuracy", markersize=4)
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("Accuracy")
        ax2.set_title("Training & Validation Accuracy")
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        fig.savefig(str(filepath), dpi=150)
        plt.close(fig)

        logger.info("Training history plot saved → {}", filepath)
        return str(filepath)


# ── Standalone Metric Computation ───────────────────────────────
def compute_metrics_from_arrays(
    y_true: list[int], y_pred: list[int]
) -> dict[str, Any]:
    """Compute metrics from raw label arrays (useful for sklearn models)."""
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, average="binary", zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, average="binary", zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, average="binary", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }
