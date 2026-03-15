"""
Model loading / saving utilities.
"""

from pathlib import Path
from typing import Any, Optional

import torch
from loguru import logger

from app.core.config import settings


def save_pytorch_model(
    model: torch.nn.Module,
    name: str,
    metadata: Optional[dict[str, Any]] = None,
) -> str:
    """Save a PyTorch model to the configured models directory."""
    model_dir = settings.model_path
    model_dir.mkdir(parents=True, exist_ok=True)

    path = model_dir / f"{name}.pt"
    payload: dict[str, Any] = {"model_state_dict": model.state_dict()}
    if metadata:
        payload["metadata"] = metadata

    torch.save(payload, str(path))
    logger.info("Saved model '{}' → {}", name, path)
    return str(path)


def load_pytorch_model(
    name: str,
    model_class: type,
    *model_args: Any,
    **model_kwargs: Any,
) -> torch.nn.Module:
    """Load a PyTorch model from the configured models directory."""
    path = settings.model_path / f"{name}.pt"
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")

    checkpoint = torch.load(str(path), map_location="cpu")
    model = model_class(*model_args, **model_kwargs)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    logger.info("Loaded model '{}' from {}", name, path)
    return model


def list_saved_models() -> list[dict[str, Any]]:
    """List all saved model files with metadata."""
    model_dir = settings.model_path
    if not model_dir.exists():
        return []

    models = []
    for f in model_dir.iterdir():
        if f.is_file() and f.suffix in (".pt", ".pth", ".pkl", ".joblib"):
            models.append(
                {
                    "name": f.stem,
                    "file": f.name,
                    "size_mb": round(f.stat().st_size / 1e6, 2),
                    "extension": f.suffix,
                }
            )
    return sorted(models, key=lambda m: m["name"])
