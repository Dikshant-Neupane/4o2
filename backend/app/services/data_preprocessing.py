"""
Data preprocessing service — image loading, augmentation, and dataset splitting.

Handles loading pothole images, generating synthetic negatives,
applying transforms, and creating train/val/test DataLoaders.
"""

import os
import random
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import torch
from loguru import logger
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from sklearn.model_selection import train_test_split


# ── Constants ───────────────────────────────────────────────────
IMAGE_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


# ── PyTorch Dataset ─────────────────────────────────────────────
class PotholeDataset(Dataset):
    """Custom PyTorch dataset for pothole classification."""

    def __init__(
        self,
        image_paths: list[str],
        labels: list[int],
        transform: Optional[transforms.Compose] = None,
    ):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        img_path = self.image_paths[idx]
        label = self.labels[idx]

        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            # Return a blank image on failure
            image = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (128, 128, 128))

        if self.transform:
            image = self.transform(image)

        return image, label


# ── Transforms ──────────────────────────────────────────────────
def get_train_transforms() -> transforms.Compose:
    """Training transforms with data augmentation."""
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def get_val_transforms() -> transforms.Compose:
    """Validation/test transforms — deterministic, no augmentation."""
    return transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


# ── Image Preprocessor ─────────────────────────────────────────
class ImagePreprocessor:
    """
    Loads pothole images, generates synthetic negatives, splits data,
    and creates PyTorch DataLoaders.
    """

    def __init__(
        self,
        data_dir: str,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        batch_size: int = 16,
        seed: int = 42,
    ):
        self.data_dir = Path(data_dir)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.batch_size = batch_size
        self.seed = seed

        self.image_paths: list[str] = []
        self.labels: list[int] = []
        self.class_names = ["normal", "pothole"]

    # ── Loading ─────────────────────────────────────────────────
    def load_images(self) -> "ImagePreprocessor":
        """Scan data directory and load image paths with labels."""
        potholes_dir = self.data_dir / "potholes"
        if not potholes_dir.exists():
            # Fall back to data_dir itself
            potholes_dir = self.data_dir

        positive_images = self._scan_images(potholes_dir)
        logger.info("Found {} pothole (positive) images", len(positive_images))

        # Label 1 = pothole
        for img_path in positive_images:
            self.image_paths.append(str(img_path))
            self.labels.append(1)

        # Generate synthetic negatives (same count as positives)
        num_negatives = len(positive_images)
        negative_images = self._generate_negatives(num_negatives)
        logger.info("Generated {} synthetic negative images", len(negative_images))

        for img_path in negative_images:
            self.image_paths.append(str(img_path))
            self.labels.append(0)

        logger.info(
            "Total dataset: {} images ({} pothole, {} normal)",
            len(self.image_paths),
            sum(1 for l in self.labels if l == 1),
            sum(1 for l in self.labels if l == 0),
        )
        return self

    def _scan_images(self, directory: Path) -> list[Path]:
        """Recursively find all supported image files."""
        images = []
        for f in sorted(directory.rglob("*")):
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTS:
                # Validate the image can be opened
                try:
                    with Image.open(f) as img:
                        img.verify()
                    images.append(f)
                except Exception:
                    logger.warning("Skipping corrupt image: {}", f)
        return images

    def _generate_negatives(self, count: int) -> list[str]:
        """Generate synthetic negative (non-pothole) images."""
        neg_dir = self.data_dir / "_synthetic_negatives"
        neg_dir.mkdir(parents=True, exist_ok=True)

        generated = []
        random.seed(self.seed)
        np.random.seed(self.seed)

        for i in range(count):
            img_path = neg_dir / f"negative_{i:04d}.jpg"
            if not img_path.exists():
                # Create random textured images (uniform road-like colors)
                color = (
                    random.randint(80, 180),
                    random.randint(80, 180),
                    random.randint(80, 180),
                )
                img = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), color)
                # Add some noise for variety
                arr = np.array(img, dtype=np.float32)
                noise = np.random.normal(0, 15, arr.shape).astype(np.float32)
                arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
                img = Image.fromarray(arr)
                img.save(str(img_path), quality=85)
            generated.append(str(img_path))

        return generated

    # ── Splitting ───────────────────────────────────────────────
    def split_data(
        self,
    ) -> tuple[list[str], list[str], list[str], list[int], list[int], list[int]]:
        """Split into train/val/test sets with stratification."""
        if not self.image_paths:
            raise ValueError("No images loaded. Call load_images() first.")

        # First split: train vs (val + test)
        val_test_ratio = self.val_ratio + self.test_ratio
        X_train, X_temp, y_train, y_temp = train_test_split(
            self.image_paths,
            self.labels,
            test_size=val_test_ratio,
            random_state=self.seed,
            stratify=self.labels,
        )

        # Second split: val vs test
        relative_test = self.test_ratio / val_test_ratio
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp,
            y_temp,
            test_size=relative_test,
            random_state=self.seed,
            stratify=y_temp,
        )

        logger.info(
            "Split: {} train / {} val / {} test",
            len(X_train), len(X_val), len(X_test),
        )
        return X_train, X_val, X_test, y_train, y_val, y_test

    # ── DataLoaders ─────────────────────────────────────────────
    def create_dataloaders(
        self,
    ) -> dict[str, DataLoader]:
        """Create train/val/test DataLoaders."""
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_data()

        train_dataset = PotholeDataset(X_train, y_train, get_train_transforms())
        val_dataset = PotholeDataset(X_val, y_val, get_val_transforms())
        test_dataset = PotholeDataset(X_test, y_test, get_val_transforms())

        loaders = {
            "train": DataLoader(
                train_dataset,
                batch_size=self.batch_size,
                shuffle=True,
                num_workers=0,
                pin_memory=True,
            ),
            "val": DataLoader(
                val_dataset,
                batch_size=self.batch_size,
                shuffle=False,
                num_workers=0,
                pin_memory=True,
            ),
            "test": DataLoader(
                test_dataset,
                batch_size=self.batch_size,
                shuffle=False,
                num_workers=0,
                pin_memory=True,
            ),
        }

        logger.info(
            "DataLoaders ready — train={}, val={}, test={} batches",
            len(loaders["train"]),
            len(loaders["val"]),
            len(loaders["test"]),
        )
        return loaders


# ── GPS Data Preprocessing ──────────────────────────────────────
class GPSPreprocessor:
    """Load, clean, and normalize GPS coordinate data."""

    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.df: Optional[pd.DataFrame] = None

    def load(self) -> pd.DataFrame:
        """Load GPS CSV and clean data."""
        if not self.csv_path.exists():
            raise FileNotFoundError(f"GPS file not found: {self.csv_path}")

        self.df = pd.read_csv(self.csv_path)
        logger.info("Loaded GPS data: {} rows × {} cols", len(self.df), len(self.df.columns))
        return self.df

    def clean(self) -> pd.DataFrame:
        """Handle missing values and outliers."""
        if self.df is None:
            self.load()

        initial_rows = len(self.df)

        # Drop rows with missing lat/lon (common column names)
        coord_cols = [c for c in self.df.columns if c.lower() in (
            "lat", "latitude", "lon", "lng", "longitude",
        )]
        if coord_cols:
            self.df = self.df.dropna(subset=coord_cols)

        # Drop fully duplicated rows
        self.df = self.df.drop_duplicates()

        dropped = initial_rows - len(self.df)
        if dropped > 0:
            logger.info("Cleaned GPS data: dropped {} rows, {} remaining", dropped, len(self.df))

        return self.df

    def normalize(self) -> pd.DataFrame:
        """Min-max normalize numeric columns."""
        if self.df is None:
            self.load()

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            min_val = self.df[col].min()
            max_val = self.df[col].max()
            if max_val - min_val > 0:
                self.df[f"{col}_normalized"] = (self.df[col] - min_val) / (max_val - min_val)

        logger.info("Normalized {} numeric columns", len(numeric_cols))
        return self.df

    def get_processed(self) -> pd.DataFrame:
        """Run the full preprocessing pipeline."""
        self.load()
        self.clean()
        self.normalize()
        return self.df
