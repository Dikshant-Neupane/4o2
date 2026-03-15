"""
YOLO dataset loader for pothole detection.

Prepares raw pothole images and labels into the YOLOv8 folder structure,
splits into train/val/test, and generates the required ``data.yaml`` file.
"""

import os
import random
import shutil
from pathlib import Path


import yaml
from loguru import logger

from ai.models.config import CLASS_NAMES, SPLIT_RATIOS, DEFAULT_PATHS


class YOLODataLoader:
    """
    Converts a flat directory of images + YOLO label files into the
    standard YOLOv8 dataset structure.

    Expected source layout::

        source_dir/
            1.jpg
            1.txt        ← YOLO label (class_id cx cy w h)
            2.jpg
            2.txt
            ...

    Output layout::

        output_dir/
            data.yaml
            images/train/  images/val/  images/test/
            labels/train/  labels/val/  labels/test/
    """

    def __init__(
        self,
        source_dir: str = DEFAULT_PATHS["source_data"],
        output_dir: str = DEFAULT_PATHS["yolo_dataset"],
        classes: dict[int, str] = None,
    ):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.classes = classes or CLASS_NAMES

        # YOLO directory tree
        self.dirs = {
            f"{split_type}/{split_name}": self.output_dir / split_type / split_name
            for split_name in ("train", "val", "test")
            for split_type in ("images", "labels")
        }

    # ── Public API ─────────────────────────────────────────────
    def prepare_dataset(
        self,
        split_ratio: tuple[float, float, float] = None,
    ) -> str:
        """
        Prepare the full YOLO dataset.

        Parameters
        ----------
        split_ratio : tuple of (train, val, test)
            Fraction of data for each split.

        Returns
        -------
        str
            Path to the generated ``data.yaml``.
        """
        if split_ratio is None:
            split_ratio = (
                SPLIT_RATIOS["train"],
                SPLIT_RATIOS["val"],
                SPLIT_RATIOS["test"],
            )

        logger.info(f"Preparing YOLOv8 dataset from {self.source_dir}...")
        self._create_dirs()

        # 1. Collect images (exclude synthetic negatives)
        images = [
            f for f in self.source_dir.glob("*.jpg")
            if not f.name.startswith("_synthetic")
        ]
        if not images:
            raise ValueError(f"No valid images found in {self.source_dir}")

        # 2. Shuffle and split
        random.seed(42)
        random.shuffle(images)

        total = len(images)
        train_end = int(total * split_ratio[0])
        val_end = train_end + int(total * split_ratio[1])

        splits = {
            "train": images[:train_end],
            "val":   images[train_end:val_end],
            "test":  images[val_end:],
        }

        # 3. Copy files into YOLO structure
        label_stats = {"with_label": 0, "generated": 0}
        for split_name, split_images in splits.items():
            img_dir = self.dirs[f"images/{split_name}"]
            lbl_dir = self.dirs[f"labels/{split_name}"]

            for img_path in split_images:
                # Copy image
                shutil.copy(img_path, img_dir / img_path.name)

                # Copy or generate label
                txt_path = img_path.with_suffix(".txt")
                dest_lbl = lbl_dir / txt_path.name

                if txt_path.exists():
                    # Validate label format before copying
                    if self._validate_label(txt_path):
                        shutil.copy(txt_path, dest_lbl)
                        label_stats["with_label"] += 1
                    else:
                        self._write_default_label(dest_lbl)
                        label_stats["generated"] += 1
                else:
                    self._write_default_label(dest_lbl)
                    label_stats["generated"] += 1

        # 4. Log statistics
        logger.info(f"Processed {total} images into YOLO format")
        logger.info(
            f"  Train: {len(splits['train'])}, "
            f"Val: {len(splits['val'])}, "
            f"Test: {len(splits['test'])}"
        )
        logger.info(
            f"  Labels: {label_stats['with_label']} existing, "
            f"{label_stats['generated']} generated"
        )

        # 5. Generate data.yaml
        return str(self._create_data_yaml())

    # ── Internals ──────────────────────────────────────────────
    def _create_dirs(self):
        """Create (or recreate) the YOLO directory structure."""
        if self.output_dir.exists():
            logger.info(f"Clearing existing dataset directory: {self.output_dir}")
            shutil.rmtree(self.output_dir)

        for d in self.dirs.values():
            d.mkdir(parents=True, exist_ok=True)

    def _create_data_yaml(self) -> Path:
        """Generate the YOLO data.yaml configuration file."""
        yaml_content = {
            "path":  str(self.output_dir.absolute()),
            "train": "images/train",
            "val":   "images/val",
            "test":  "images/test",
            "names": self.classes,
        }
        yaml_path = self.output_dir / "data.yaml"
        with open(yaml_path, "w") as f:
            yaml.dump(yaml_content, f, default_flow_style=False)
        logger.info(f"Generated YAML config: {yaml_path}")
        return yaml_path

    @staticmethod
    def _validate_label(label_path: Path) -> bool:
        """
        Validate a YOLO label file.

        Each line should be: class_id center_x center_y width height
        with all coordinate values in [0, 1].
        """
        try:
            with open(label_path) as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) != 5:
                        return False
                    class_id = int(parts[0])
                    coords = [float(x) for x in parts[1:]]
                    if any(c < 0 or c > 1 for c in coords):
                        return False
            return True
        except (ValueError, IOError):
            return False

    @staticmethod
    def _write_default_label(dest_path: Path):
        """Write a default bounding box label (centre 50 %)."""
        with open(dest_path, "w") as f:
            f.write("0 0.5 0.5 0.5 0.5\n")


if __name__ == "__main__":
    loader = YOLODataLoader(source_dir="Data/potholes")
    yaml_file = loader.prepare_dataset()
    print(f"Dataset ready. Config: {yaml_file}")
