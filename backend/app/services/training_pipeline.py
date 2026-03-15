"""
Training pipeline — real PyTorch model training with ResNet18 transfer learning.

Replaces the Phase 1 placeholder with a complete training loop including:
- Data loading via ImagePreprocessor
- ResNet18 fine-tuning for binary classification
- Epoch-level loss/accuracy tracking
- Early stopping
- Versioned model saving with evaluation metrics
"""

from pathlib import Path
from typing import Any, Optional

import torch
import torch.nn as nn
import torch.optim as optim
from loguru import logger
from torchvision import models

from app.core.config import settings
from app.services.data_preprocessing import ImagePreprocessor
from app.services.model_evaluation import ModelEvaluator
from app.services.model_versioning import ModelVersioning


class TrainingPipeline:
    """
    End-to-end training pipeline for pothole detection.

    Steps:
        1. load_data       — load and preprocess images via ImagePreprocessor
        2. build_model     — create ResNet18 with custom classifier head
        3. train           — training loop with validation
        4. evaluate        — compute metrics on test set
        5. save_model      — persist with versioning and metadata
    """

    def __init__(
        self,
        dataset_path: str,
        model_type: str = "resnet18",
        epochs: int = 10,
        learning_rate: float = 1e-3,
        batch_size: int = 16,
        patience: int = 3,
    ):
        self.dataset_path = Path(dataset_path)
        self.model_type = model_type
        self.epochs = epochs
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.patience = patience  # early stopping patience

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model: Optional[nn.Module] = None
        self.dataloaders: dict = {}
        self.metrics: dict[str, Any] = {}

        # Training history
        self.train_losses: list[float] = []
        self.val_losses: list[float] = []
        self.train_accs: list[float] = []
        self.val_accs: list[float] = []

    # ── Step 1: Load Data ───────────────────────────────────────
    def load_data(self) -> None:
        """Load dataset and create DataLoaders."""
        logger.info("Loading data from {}", self.dataset_path)
        if not self.dataset_path.exists():
            raise FileNotFoundError(f"Dataset path not found: {self.dataset_path}")

        preprocessor = ImagePreprocessor(
            data_dir=str(self.dataset_path),
            batch_size=self.batch_size,
        )
        preprocessor.load_images()
        self.dataloaders = preprocessor.create_dataloaders()
        logger.info("Data loaded — {} splits ready", len(self.dataloaders))

    # ── Step 2: Build Model ─────────────────────────────────────
    def build_model(self) -> nn.Module:
        """Create a ResNet18 model with transfer learning."""
        logger.info("Building {} model …", self.model_type)

        if self.model_type in ("resnet18", "resnet"):
            model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
            # Freeze early layers
            for param in list(model.parameters())[:-10]:
                param.requires_grad = False
            # Replace classifier head for binary classification
            model.fc = nn.Sequential(
                nn.Dropout(0.3),
                nn.Linear(model.fc.in_features, 2),
            )
        else:
            # Fallback: simple ResNet18 without pretrained weights
            model = models.resnet18(weights=None)
            model.fc = nn.Linear(model.fc.in_features, 2)

        model = model.to(self.device)
        self.model = model
        logger.info("Model built on {} — trainable params: {}",
                     self.device, sum(p.numel() for p in model.parameters() if p.requires_grad))
        return model

    # ── Step 3: Train ───────────────────────────────────────────
    def train(self) -> None:
        """Run the training loop with early stopping."""
        if self.model is None:
            self.build_model()

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(
            filter(lambda p: p.requires_grad, self.model.parameters()),
            lr=self.learning_rate,
        )
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", factor=0.5, patience=2
        )

        best_val_loss = float("inf")
        patience_counter = 0

        logger.info("Starting training — {} epochs, lr={}", self.epochs, self.learning_rate)

        for epoch in range(1, self.epochs + 1):
            # ── Training phase ──
            self.model.train()
            running_loss = 0.0
            correct = 0
            total = 0

            for images, labels in self.dataloaders["train"]:
                images = images.to(self.device)
                labels = labels.to(self.device)

                optimizer.zero_grad()
                outputs = self.model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

                running_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

            train_loss = running_loss / total
            train_acc = correct / total
            self.train_losses.append(train_loss)
            self.train_accs.append(train_acc)

            # ── Validation phase ──
            val_loss, val_acc = self._validate(criterion)
            self.val_losses.append(val_loss)
            self.val_accs.append(val_acc)

            scheduler.step(val_loss)

            logger.info(
                "Epoch {}/{} — train_loss={:.4f}, train_acc={:.4f}, "
                "val_loss={:.4f}, val_acc={:.4f}",
                epoch, self.epochs, train_loss, train_acc, val_loss, val_acc,
            )

            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= self.patience:
                    logger.info("Early stopping at epoch {}", epoch)
                    break

        self.metrics["epochs_trained"] = len(self.train_losses)
        self.metrics["final_train_loss"] = self.train_losses[-1]
        self.metrics["final_val_loss"] = self.val_losses[-1]
        self.metrics["final_train_acc"] = self.train_accs[-1]
        self.metrics["final_val_acc"] = self.val_accs[-1]
        logger.info("Training complete — {} epochs", self.metrics["epochs_trained"])

    def _validate(self, criterion: nn.Module) -> tuple:
        """Run validation and return (loss, accuracy)."""
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in self.dataloaders["val"]:
                images = images.to(self.device)
                labels = labels.to(self.device)

                outputs = self.model(images)
                loss = criterion(outputs, labels)

                running_loss += loss.item() * images.size(0)
                _, predicted = torch.max(outputs, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        return running_loss / total, correct / total

    # ── Step 4: Evaluate ────────────────────────────────────────
    def evaluate(self) -> dict[str, Any]:
        """Evaluate the model on the test set."""
        logger.info("Evaluating model on test set …")
        evaluator = ModelEvaluator(self.model, self.device)
        test_metrics = evaluator.evaluate(self.dataloaders["test"])

        # Generate plots
        plots_dir = str(settings.model_path / "plots")
        evaluator.plot_confusion_matrix(plots_dir)
        evaluator.plot_training_history(
            self.train_losses, self.val_losses,
            self.train_accs, self.val_accs,
            plots_dir,
        )

        # Merge training and test metrics
        self.metrics.update(test_metrics)
        logger.info("Evaluation complete — accuracy={:.4f}", test_metrics["accuracy"])
        return self.metrics

    # ── Step 5: Save Model ──────────────────────────────────────
    def save_model(self, output_dir: Optional[str] = None) -> str:
        """Save the trained model with versioning."""
        model_dir = output_dir or str(settings.model_path)
        versioning = ModelVersioning(model_dir)

        hyperparams = {
            "model_type": self.model_type,
            "epochs": self.epochs,
            "learning_rate": self.learning_rate,
            "batch_size": self.batch_size,
            "patience": self.patience,
        }

        result = versioning.save_model(
            model=self.model,
            metrics=self.metrics,
            hyperparams=hyperparams,
            dataset_info=str(self.dataset_path),
        )

        self.metrics["model_path"] = result["model_path"]
        self.metrics["model_version"] = result["version"]
        logger.info("Model saved as v{}", result["version"])
        return result["model_path"]

    # ── Full Pipeline ───────────────────────────────────────────
    def run(self, output_dir: Optional[str] = None) -> dict[str, Any]:
        """Execute the full training pipeline: load → build → train → evaluate → save."""
        self.load_data()
        self.build_model()
        self.train()
        metrics = self.evaluate()
        self.save_model(output_dir)
        return metrics
