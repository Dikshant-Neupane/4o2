"""
Tests for Phase 2 AI pipeline components.
"""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
import torch
from PIL import Image
from torchvision import models

from app.services.model_evaluation import ModelEvaluator, compute_metrics_from_arrays
from app.services.model_versioning import ModelVersioning


# ── Fixtures ────────────────────────────────────────────────────
@pytest.fixture()
def sample_image_dir():
    """Create a temp directory with fake pothole and negative images."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create potholes subdirectory
        potholes = Path(tmpdir) / "potholes"
        potholes.mkdir()
        for i in range(10):
            img = Image.new("RGB", (100, 100), (random_color()))
            img.save(str(potholes / f"pothole_{i}.jpg"))

        yield tmpdir


@pytest.fixture()
def dummy_model():
    """Create a simple ResNet18 model for testing."""
    model = models.resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)
    model.eval()
    return model


@pytest.fixture()
def model_dir():
    """Temp directory for model saving/loading."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


def random_color():
    return tuple(np.random.randint(0, 255, 3).tolist())


# ── Model Evaluation Tests ──────────────────────────────────────
class TestModelEvaluation:

    def test_compute_metrics_from_arrays(self):
        """Should compute correct metrics from label arrays."""
        y_true = [1, 1, 0, 0, 1, 0, 1, 0]
        y_pred = [1, 0, 0, 0, 1, 1, 1, 0]

        metrics = compute_metrics_from_arrays(y_true, y_pred)

        assert "accuracy" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert "f1_score" in metrics
        assert "confusion_matrix" in metrics
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["precision"] <= 1.0
        assert 0.0 <= metrics["recall"] <= 1.0
        assert 0.0 <= metrics["f1_score"] <= 1.0

    def test_compute_metrics_perfect(self):
        """Perfect predictions should give accuracy=1.0."""
        y_true = [0, 0, 1, 1, 0, 1]
        y_pred = [0, 0, 1, 1, 0, 1]

        metrics = compute_metrics_from_arrays(y_true, y_pred)

        assert metrics["accuracy"] == 1.0
        assert metrics["f1_score"] == 1.0

    def test_evaluator_with_dummy_model(self, dummy_model):
        """ModelEvaluator should process a DataLoader and return metrics."""
        # Create a small fake DataLoader
        images = torch.randn(8, 3, 224, 224)
        labels = torch.tensor([0, 1, 0, 1, 0, 1, 0, 1])
        dataset = torch.utils.data.TensorDataset(images, labels)
        loader = torch.utils.data.DataLoader(dataset, batch_size=4)

        evaluator = ModelEvaluator(dummy_model, device="cpu")
        metrics = evaluator.evaluate(loader)

        assert "accuracy" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert "f1_score" in metrics
        assert "confusion_matrix" in metrics
        assert metrics["total_samples"] == 8


# ── Model Versioning Tests ──────────────────────────────────────
class TestModelVersioning:

    def test_save_and_load(self, dummy_model, model_dir):
        """Should save a model and load it back."""
        versioning = ModelVersioning(model_dir)

        result = versioning.save_model(
            model=dummy_model,
            metrics={"accuracy": 0.85, "f1_score": 0.83},
            hyperparams={"epochs": 5, "lr": 0.001},
            dataset_info="test_dataset",
        )

        assert result["version"] == 1
        assert Path(result["model_path"]).exists()
        assert Path(result["metadata_path"]).exists()

        # Load metadata
        meta = versioning.load_metadata(1)
        assert meta["version"] == 1
        assert meta["metrics"]["accuracy"] == 0.85
        assert meta["dataset"] == "test_dataset"

    def test_auto_increment_version(self, dummy_model, model_dir):
        """Versions should auto-increment."""
        versioning = ModelVersioning(model_dir)

        r1 = versioning.save_model(dummy_model, {"accuracy": 0.80})
        r2 = versioning.save_model(dummy_model, {"accuracy": 0.85})
        r3 = versioning.save_model(dummy_model, {"accuracy": 0.90})

        assert r1["version"] == 1
        assert r2["version"] == 2
        assert r3["version"] == 3

    def test_list_versions(self, dummy_model, model_dir):
        """Should list all saved versions."""
        versioning = ModelVersioning(model_dir)
        versioning.save_model(dummy_model, {"accuracy": 0.80})
        versioning.save_model(dummy_model, {"accuracy": 0.90})

        versions = versioning.list_versions()
        assert len(versions) == 2
        assert versions[0]["version"] == 1
        assert versions[1]["version"] == 2

    def test_get_latest_version(self, dummy_model, model_dir):
        """Should return the highest version number."""
        versioning = ModelVersioning(model_dir)
        assert versioning.get_latest_version() is None

        versioning.save_model(dummy_model, {"accuracy": 0.80})
        versioning.save_model(dummy_model, {"accuracy": 0.90})

        assert versioning.get_latest_version() == 2

    def test_load_nonexistent(self, model_dir):
        """Should raise FileNotFoundError for missing version."""
        versioning = ModelVersioning(model_dir)
        with pytest.raises(FileNotFoundError):
            versioning.load_model_weights(99)


# ── API Endpoint Tests ──────────────────────────────────────────
class TestAIEndpoints:

    def test_model_status_empty(self, client):
        """GET /api/ai/model-status should return empty list when no models."""
        response = client.get("/api/ai/model-status")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_model_status_version_not_found(self, client):
        """GET /api/ai/model-status/999 should return 404."""
        response = client.get("/api/ai/model-status/999")
        assert response.status_code == 404

    @patch("app.api.ai_routes.InferenceService.predict_from_bytes")
    def test_predict_no_model(self, mock_predict, client):
        """POST /api/ai/predict without trained model should return error."""
        mock_predict.side_effect = FileNotFoundError("Model not found")
        
        # Create a small test image
        img = Image.new("RGB", (50, 50), (100, 100, 100))
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            img.save(f, format="JPEG")
            f.flush()
            img_path = f.name

        try:
            with open(img_path, "rb") as f:
                response = client.post(
                    "/api/ai/predict",
                    files={"file": ("test.jpg", f, "image/jpeg")},
                )
            # Should get 500 or 404 because no model is trained
            assert response.status_code in (404, 500)
        finally:
            os.unlink(img_path)
