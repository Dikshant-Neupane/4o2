"""
Model versioning service — auto-incrementing versions with metadata.

Saves models as:
    models_store/model_v1.pt
    models_store/model_v1_metadata.json
    models_store/model_v2.pt
    models_store/model_v2_metadata.json
    ...
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import torch
from loguru import logger

from app.core.config import settings


class ModelVersioning:
    """Manage versioned model storage with metadata."""

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = Path(model_dir) if model_dir else settings.model_path
        self.model_dir.mkdir(parents=True, exist_ok=True)

    # ── Version Discovery ───────────────────────────────────────
    def get_next_version(self) -> int:
        """Determine the next version number."""
        existing = self._list_model_files()
        if not existing:
            return 1
        versions = [self._extract_version(f.stem) for f in existing]
        versions = [v for v in versions if v is not None]
        return max(versions) + 1 if versions else 1

    def get_latest_version(self) -> Optional[int]:
        """Get the latest (highest) version number, or None if no models exist."""
        existing = self._list_model_files()
        if not existing:
            return None
        versions = [self._extract_version(f.stem) for f in existing]
        versions = [v for v in versions if v is not None]
        return max(versions) if versions else None

    # ── Save ────────────────────────────────────────────────────
    def save_model(
        self,
        model: torch.nn.Module,
        metrics: dict[str, Any],
        hyperparams: Optional[dict[str, Any]] = None,
        dataset_info: Optional[str] = None,
        version: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Save a model with auto-versioning and metadata.

        Returns:
            Dict with version, model_path, metadata_path.
        """
        if version is None:
            version = self.get_next_version()

        model_filename = f"model_v{version}.pt"
        meta_filename = f"model_v{version}_metadata.json"

        model_path = self.model_dir / model_filename
        meta_path = self.model_dir / meta_filename

        # Save model weights
        torch.save(
            {
                "model_state_dict": model.state_dict(),
                "version": version,
            },
            str(model_path),
        )

        # Build metadata
        metadata = {
            "version": version,
            "model_file": model_filename,
            "training_date": datetime.now(timezone.utc).isoformat(),
            "dataset": dataset_info or "unknown",
            "metrics": metrics,
            "hyperparameters": hyperparams or {},
            "model_architecture": model.__class__.__name__,
        }

        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2, default=str)

        logger.info(
            "Saved model v{} → {} (acc={:.4f})",
            version,
            model_path,
            metrics.get("accuracy", 0.0),
        )

        return {
            "version": version,
            "model_path": str(model_path),
            "metadata_path": str(meta_path),
            "metrics": metrics,
        }

    # ── Load ────────────────────────────────────────────────────
    def load_model_weights(self, version: int) -> dict[str, Any]:
        """Load model checkpoint dict for a given version."""
        model_path = self.model_dir / f"model_v{version}.pt"
        if not model_path.exists():
            raise FileNotFoundError(f"Model v{version} not found: {model_path}")

        checkpoint = torch.load(str(model_path), map_location="cpu")
        logger.info("Loaded model weights for v{}", version)
        return checkpoint

    def load_metadata(self, version: int) -> dict[str, Any]:
        """Load metadata JSON for a given version."""
        meta_path = self.model_dir / f"model_v{version}_metadata.json"
        if not meta_path.exists():
            raise FileNotFoundError(f"Metadata for v{version} not found: {meta_path}")

        with open(meta_path, "r") as f:
            return json.load(f)

    # ── Listing ─────────────────────────────────────────────────
    def list_versions(self) -> list[dict[str, Any]]:
        """List all saved model versions with their metadata."""
        versions = []
        for model_file in sorted(self._list_model_files()):
            v = self._extract_version(model_file.stem)
            if v is None:
                continue

            entry: dict[str, Any] = {
                "version": v,
                "model_file": model_file.name,
                "size_mb": round(model_file.stat().st_size / 1e6, 2),
            }

            # Try to load metadata
            try:
                meta = self.load_metadata(v)
                entry["training_date"] = meta.get("training_date")
                entry["dataset"] = meta.get("dataset")
                entry["metrics"] = meta.get("metrics", {})
            except FileNotFoundError:
                entry["training_date"] = None
                entry["dataset"] = None
                entry["metrics"] = {}

            versions.append(entry)

        return versions

    # ── Helpers ─────────────────────────────────────────────────
    def _list_model_files(self) -> list[Path]:
        """List .pt model files that match the versioned naming pattern."""
        if not self.model_dir.exists():
            return []
        return sorted(
            f
            for f in self.model_dir.iterdir()
            if f.is_file()
            and f.suffix == ".pt"
            and f.stem.startswith("model_v")
        )

    @staticmethod
    def _extract_version(stem: str) -> Optional[int]:
        """Extract version number from a filename stem like 'model_v3'."""
        if not stem.startswith("model_v"):
            return None
        try:
            return int(stem.replace("model_v", ""))
        except ValueError:
            return None
