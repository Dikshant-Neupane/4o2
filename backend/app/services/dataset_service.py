"""
Dataset service — business logic for dataset management.
"""

import os
from pathlib import Path
from typing import Optional

import pandas as pd
from loguru import logger
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.dataset import Dataset
from app.utils.file_utils import count_files, get_directory_info, list_image_files


class DatasetService:
    """Handles dataset registration, validation, and scanning."""

    SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    SUPPORTED_DATA_EXTS = {".csv", ".json", ".xlsx"}

    def __init__(self, db: Session):
        self.db = db

    # ── Registration ────────────────────────────────────────────
    def register_dataset(
        self,
        name: str,
        file_path: str,
        file_type: str,
        description: Optional[str] = None,
    ) -> Dataset:
        """Validate a path and register the dataset in the DB."""
        path = Path(file_path).resolve()

        # Issue #3: Prevent path traversal — restrict to configured dataset dir
        allowed_root = settings.dataset_path.resolve()
        if not str(path).startswith(str(allowed_root)):
            raise ValueError(f"Path must be within the configured data directory: {allowed_root}")

        if not path.exists():
            raise FileNotFoundError(f"Path does not exist: {file_path}")

        # Count samples
        num_samples = self._count_samples(path, file_type)

        dataset = Dataset(
            name=name,
            description=description,
            file_path=str(path.resolve()),
            file_type=file_type,
            num_samples=num_samples,
        )
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)
        logger.info("Registered dataset '{}' with {} samples", name, num_samples)
        return dataset

    # ── Scanning ────────────────────────────────────────────────
    def scan_data_directory(self) -> list[dict]:
        """Scan the configured data directory and return available datasets."""
        data_dir = settings.dataset_path
        if not data_dir.exists():
            logger.warning("Data directory does not exist: {}", data_dir)
            return []

        results = []
        for entry in sorted(data_dir.iterdir()):
            if entry.is_dir():
                info = get_directory_info(entry)
                file_type = self._detect_type(entry)
                num = self._count_samples(entry, file_type)
                results.append(
                    {
                        "name": entry.name,
                        "file_path": str(entry.resolve()),
                        "file_type": file_type,
                        "num_samples": num,
                    }
                )
        return results

    # ── Validation ──────────────────────────────────────────────
    def validate_dataset(self, file_path: str) -> dict:
        """Return validation info about a dataset path."""
        path = Path(file_path)
        if not path.exists():
            return {"valid": False, "error": "Path does not exist"}

        file_type = self._detect_type(path)
        num = self._count_samples(path, file_type)
        return {"valid": True, "file_type": file_type, "num_samples": num}

    def load_csv(self, file_path: str) -> pd.DataFrame:
        """Load a CSV file as a pandas DataFrame."""
        path = Path(file_path)
        if not path.exists() or path.suffix.lower() != ".csv":
            raise ValueError(f"Invalid CSV path: {file_path}")
        df = pd.read_csv(path)
        logger.info("Loaded CSV '{}' — {} rows × {} cols", path.name, len(df), len(df.columns))
        return df

    # ── Helpers ─────────────────────────────────────────────────
    def _detect_type(self, path: Path) -> str:
        """Detect whether a directory contains images, data files, or mixed."""
        if path.is_file():
            ext = path.suffix.lower()
            if ext in self.SUPPORTED_IMAGE_EXTS:
                return "images"
            if ext in self.SUPPORTED_DATA_EXTS:
                return "csv"
            return "unknown"

        exts = {f.suffix.lower() for f in path.rglob("*") if f.is_file()}
        has_images = bool(exts & self.SUPPORTED_IMAGE_EXTS)
        has_data = bool(exts & self.SUPPORTED_DATA_EXTS)

        if has_images and has_data:
            return "mixed"
        if has_images:
            return "images"
        if has_data:
            return "csv"
        return "unknown"

    def _count_samples(self, path: Path, file_type: str) -> int:
        """Count samples depending on type."""
        if path.is_file():
            if file_type == "csv":
                try:
                    df = pd.read_csv(path)
                    return len(df)
                except Exception:
                    return 0
            return 1

        if file_type == "images":
            return count_files(path, self.SUPPORTED_IMAGE_EXTS)
        if file_type == "csv":
            csv_files = list(path.rglob("*.csv"))
            if csv_files:
                try:
                    return sum(len(pd.read_csv(f)) for f in csv_files)
                except Exception:
                    return len(csv_files)
        # mixed or unknown
        return count_files(path)
