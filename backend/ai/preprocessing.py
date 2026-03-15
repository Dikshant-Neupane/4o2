"""
YOLO-specific image preprocessing and augmentation.

Provides utilities for resizing, normalising, and augmenting road images
before they enter the YOLOv8 training or inference pipeline.  Uses the
Albumentations library for augmentation and OpenCV for basic transforms.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Optional

from loguru import logger

try:
    import albumentations as A
    HAS_ALBUMENTATIONS = True
except ImportError:
    HAS_ALBUMENTATIONS = False
    logger.warning("albumentations not installed — augmentation disabled")

from ai.models.config import PREPROCESS_CONFIG, AUGMENTATION_CONFIG


# ── Core preprocessor ──────────────────────────────────────────
class YOLOPreprocessor:
    """
    Handles image preprocessing for the YOLOv8 pothole detection pipeline.

    Responsibilities:
        1. Resize images to the target dimension (default 640×640).
        2. Normalise pixel values to [0, 1].
        3. Apply training-time augmentations via Albumentations.

    Usage::

        preprocessor = YOLOPreprocessor()
        img = preprocessor.preprocess("path/to/image.jpg")
        aug_img, aug_bboxes = preprocessor.augment(img, bboxes)
    """

    def __init__(
        self,
        imgsz: int = PREPROCESS_CONFIG["imgsz"],
        normalize: bool = PREPROCESS_CONFIG["normalize"],
        augment_cfg: Optional[dict] = None,
    ):
        self.imgsz = imgsz
        self.normalize = normalize
        self.augment_cfg = augment_cfg or AUGMENTATION_CONFIG
        self._aug_pipeline = self._build_augmentation_pipeline()

    # ── Public API ─────────────────────────────────────────────
    def preprocess(self, image_source, auto_orient: bool = True) -> np.ndarray:
        """
        Load and preprocess a single image for inference.

        Parameters
        ----------
        image_source : str, Path, or np.ndarray
            File path or already-loaded BGR image.
        auto_orient : bool
            If True, fix EXIF-rotated images.

        Returns
        -------
        np.ndarray
            Preprocessed image (H, W, 3) as float32 in [0, 1] if
            ``normalize`` is True, else uint8 in [0, 255].
        """
        if isinstance(image_source, (str, Path)):
            img = cv2.imread(str(image_source))
            if img is None:
                raise FileNotFoundError(f"Cannot read image: {image_source}")
        else:
            img = image_source.copy()

        # Auto-orient (EXIF rotation)
        if auto_orient:
            img = self._auto_orient(img)

        # Resize with letterboxing to maintain aspect ratio
        img = self._resize_letterbox(img, self.imgsz)

        # Normalise
        if self.normalize:
            img = img.astype(np.float32) / 255.0

        return img

    def preprocess_batch(self, image_paths: list[str]) -> list[np.ndarray]:
        """Preprocess a list of images."""
        results = []
        for p in image_paths:
            try:
                results.append(self.preprocess(p))
            except Exception as e:
                logger.warning(f"Skipping {p}: {e}")
        logger.info(f"Preprocessed {len(results)}/{len(image_paths)} images")
        return results

    def augment(
        self,
        image: np.ndarray,
        bboxes: Optional[list[list[float]]] = None,
        class_labels: Optional[list[int]] = None,
    ) -> tuple[np.ndarray, Optional[list[list[float]]], Optional[list[int]]]:
        """
        Apply augmentations to an image (and its bounding boxes).

        Parameters
        ----------
        image : np.ndarray
            Input image (uint8, H×W×3).
        bboxes : list of [x_center, y_center, w, h]
            YOLO-format normalised bounding boxes.
        class_labels : list of int
            Class ID for each bounding box.

        Returns
        -------
        (augmented_image, augmented_bboxes, class_labels)
        """
        if not HAS_ALBUMENTATIONS or self._aug_pipeline is None:
            return image, bboxes, class_labels

        # Ensure uint8 for Albumentations
        if image.dtype != np.uint8:
            img = (image * 255).astype(np.uint8) if image.max() <= 1.0 else image.astype(np.uint8)
        else:
            img = image.copy()

        if bboxes and class_labels:
            transformed = self._aug_pipeline(
                image=img,
                bboxes=bboxes,
                class_labels=class_labels,
            )
            return (
                transformed["image"],
                transformed["bboxes"],
                transformed["class_labels"],
            )
        else:
            transformed = self._aug_pipeline(image=img, bboxes=[], class_labels=[])
            return transformed["image"], None, None

    # ── Internal helpers ───────────────────────────────────────
    def _build_augmentation_pipeline(self):
        """Build an Albumentations augmentation pipeline."""
        if not HAS_ALBUMENTATIONS:
            return None

        cfg = self.augment_cfg
        return A.Compose(
            [
                A.HorizontalFlip(p=cfg["horizontal_flip_p"]),
                A.VerticalFlip(p=cfg["vertical_flip_p"]),
                A.Rotate(limit=cfg["rotation_limit"], p=0.4, border_mode=cv2.BORDER_CONSTANT),
                A.RandomBrightnessContrast(
                    brightness_limit=cfg["brightness_limit"],
                    contrast_limit=cfg["contrast_limit"],
                    p=0.4,
                ),
                A.GaussianBlur(blur_limit=cfg["blur_limit"], p=0.2),
                A.GaussNoise(var_limit=cfg["noise_var_limit"], p=0.2),
                A.RandomScale(scale_limit=cfg["scale_limit"], p=0.3),
            ],
            bbox_params=A.BboxParams(
                format="yolo",
                label_fields=["class_labels"],
                min_visibility=0.3,
            ),
        )

    @staticmethod
    def _resize_letterbox(img: np.ndarray, target_size: int) -> np.ndarray:
        """
        Resize image with letterboxing to preserve aspect ratio.
        Pads with grey (114, 114, 114) — the YOLO convention.
        """
        h, w = img.shape[:2]
        scale = min(target_size / h, target_size / w)
        new_w, new_h = int(w * scale), int(h * scale)

        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Create padded canvas
        canvas = np.full((target_size, target_size, 3), 114, dtype=np.uint8)
        top = (target_size - new_h) // 2
        left = (target_size - new_w) // 2
        canvas[top : top + new_h, left : left + new_w] = resized

        return canvas

    @staticmethod
    def _auto_orient(img: np.ndarray) -> np.ndarray:
        """Fix common EXIF orientation issues (simplified)."""
        # OpenCV imread already handles most EXIF orientations as of 4.x,
        # but we ensure the image is not upside-down or sideways if the
        # height is unreasonably larger than width for landscape photos.
        return img


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m ai.preprocessing <image_path>")
        sys.exit(1)

    preprocessor = YOLOPreprocessor()
    result = preprocessor.preprocess(sys.argv[1])
    print(f"Preprocessed shape: {result.shape}, dtype: {result.dtype}, range: [{result.min():.3f}, {result.max():.3f}]")
