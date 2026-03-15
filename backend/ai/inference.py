"""
YOLOv8 inference for pothole detection with severity classification.

Runs a trained model on single images or batches and returns structured
predictions including bounding boxes, confidence scores, and inferred
pothole severity (minor / moderate / severe) based on bounding-box area.
"""

import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from loguru import logger

from ai.models.config import (
    INFERENCE_CONFIG,
    SEVERITY_LEVELS,
    SEVERITY_THRESHOLDS,
)
from ai.utils.visualization import draw_detections
import math


class YOLOInference:
    """
    Runs inference using a trained YOLOv8 pothole detection model.

    Usage::

        inferencer = YOLOInference("ai/weights/pothole_best.pt")
        predictions = inferencer.predict("test_image.jpg")
        for p in predictions:
            print(p["class_name"], p["severity"], p["confidence"])
    """

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {self.model_path}")

        logger.info(f"Loading YOLO model from {self.model_path}")

        import torch
        # PyTorch 2.6 security workaround for loading Ultralytics weights
        original_load = torch.load
        def safe_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = safe_load

        from ultralytics import YOLO
        self.model = YOLO(str(self.model_path))

    # ── Single-image prediction ────────────────────────────────
    def predict(
        self,
        image_path: str,
        conf_threshold: float = INFERENCE_CONFIG["conf_threshold"],
        iou_threshold: float = INFERENCE_CONFIG["iou_threshold"],
        save_dir: Optional[str] = None,
    ) -> list[dict]:
        """
        Run prediction on a single image.

        Parameters
        ----------
        image_path : str
            Path to the input image.
        conf_threshold : float
            Minimum confidence to keep a detection.
        iou_threshold : float
            IoU threshold for non-maximum suppression.
        save_dir : str, optional
            If provided, save the annotated image here.

        Returns
        -------
        list of dict
            Each dict has: box, confidence, class_id, class_name, severity.
        """
        if not Path(image_path).exists():
            raise FileNotFoundError(f"Input image not found: {image_path}")

        logger.info(f"Running inference on {image_path}")
        results = self.model.predict(
            source=image_path,
            conf=conf_threshold,
            iou=iou_threshold,
            augment=INFERENCE_CONFIG.get("augment", False),
            save=False,
            verbose=False,
        )

        result = results[0]
        img_h, img_w = result.orig_shape
        image_area = img_h * img_w

        # Extract detection data
        boxes = result.boxes.xyxy.cpu().numpy().tolist() if result.boxes is not None else []
        confidences = result.boxes.conf.cpu().numpy().tolist() if result.boxes is not None else []
        classes = result.boxes.cls.cpu().numpy().tolist() if result.boxes is not None else []

        predictions = []
        for i in range(len(boxes)):
            x1, y1, x2, y2 = boxes[i]
            cls_id = int(classes[i])
            cls_name = result.names.get(cls_id, f"class_{cls_id}")

            # ── Severity classification from bounding-box area ratio ──
            box_area = (x2 - x1) * (y2 - y1)
            severity = self._classify_severity(box_area, image_area)
            
            # ── Approach 2: Pinhole camera physical scale estimation ──
            # Assumptions: Camera held 1.5m (150cm) from ground, 65 degree horizontal FOV
            Z_CM = 150.0
            FOV_DEG = 65.0
            # Width of the entire image frame on the ground in cm
            w_scene_cm = 2 * Z_CM * math.tan(math.radians(FOV_DEG / 2))
            
            box_w = x2 - x1
            box_h = y2 - y1
            
            width_cm = round((box_w / img_w) * w_scene_cm, 1)
            # Use w_scene_cm and img_w to keep physical aspect ratio the same (assuming square pixels)
            depth_cm = round((box_h / img_w) * w_scene_cm, 1)
            
            # Surface area calculation
            area_sqm = round((width_cm * depth_cm) / 10000.0, 2)
            
            # ── Efficient OpenCV Environment Heuristics ──
            road_type, weather = self._estimate_environment(image_path)

            predictions.append({
                "box":        [x1, y1, x2, y2],
                "confidence": round(float(confidences[i]), 4),
                "class_id":   cls_id,
                "class_name": cls_name,
                "severity":   severity,
                "width_cm":   width_cm,
                "depth_cm":   depth_cm,
                "area_sqm":   area_sqm,
                "road_type":  road_type,
                "weather":    weather,
            })

        logger.info(f"Found {len(predictions)} pothole(s)")

        # Optionally save annotated image
        if save_dir and predictions:
            self._save_annotated(image_path, predictions, result.names, save_dir)

        return predictions

    # ── Batch prediction ───────────────────────────────────────
    def predict_batch(
        self,
        image_paths: list[str],
        conf_threshold: float = INFERENCE_CONFIG["conf_threshold"],
        save_dir: Optional[str] = None,
    ) -> dict[str, list[dict]]:
        """
        Run predictions on multiple images.

        Returns
        -------
        dict
            Mapping from image filename to list of predictions.
        """
        all_results = {}
        for path in image_paths:
            try:
                preds = self.predict(path, conf_threshold=conf_threshold, save_dir=save_dir)
                all_results[Path(path).name] = preds
            except Exception as e:
                logger.warning(f"Failed on {path}: {e}")
                all_results[Path(path).name] = []

        total = sum(len(v) for v in all_results.values())
        logger.info(f"Batch inference complete: {total} detections across {len(all_results)} images")
        return all_results

    # ── Severity classification ────────────────────────────────
    @staticmethod
    def _classify_severity(box_area: float, image_area: float) -> str:
        """
        Classify pothole severity based on the bounding-box area
        as a fraction of the total image area.

        - < 5%  → minor
        - 5–15% → moderate
        - ≥ 15% → severe
        """
        if image_area == 0:
            return "minor"

        ratio = box_area / image_area

        if ratio < SEVERITY_THRESHOLDS["minor"]:
            return "minor"
        elif ratio < SEVERITY_THRESHOLDS["moderate"]:
            return "moderate"
        else:
            return "severe"

    @staticmethod
    def _estimate_environment(image_path: str) -> tuple[str, str]:
        """
        Uses efficient OpenCV color and brightness heuristics to estimate
        the broader context of the image without needing a heavy deep network.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return "Asphalt", "Dry"
            
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            avg_h = np.mean(hsv[:, :, 0])
            avg_s = np.mean(hsv[:, :, 1])
            avg_v = np.mean(hsv[:, :, 2])
            
            # Road Type Heuristic
            road_type = "Asphalt"
            if avg_s > 40 and 10 < avg_h < 40:
                road_type = "Dirt/Gravel"
            elif avg_v > 150 and avg_s < 30:
                road_type = "Concrete"
                
            # Weather Heuristic
            weather = "Dry"
            if avg_v < 90 or avg_s > 100:
                weather = "Wet"
                
            return road_type, weather
        except Exception as e:
            logger.warning(f"Failed to estimate environment: {e}")
            return "Asphalt", "Dry"

    # ── Save annotated image ───────────────────────────────────
    @staticmethod
    def _save_annotated(
        image_path: str,
        predictions: list[dict],
        class_names: dict,
        save_dir: str,
    ):
        """Draw detections and save the annotated image."""
        os.makedirs(save_dir, exist_ok=True)
        img = cv2.imread(image_path)
        if img is None:
            return

        annotated = draw_detections(img, predictions)
        out_path = Path(save_dir) / Path(image_path).name
        cv2.imwrite(str(out_path), annotated)
        logger.info(f"Saved annotated image to {out_path}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python -m ai.inference <model_path> <image_path> [--save]")
        sys.exit(1)

    model_file = sys.argv[1]
    test_img = sys.argv[2]
    save = "runs/detect/predictions" if "--save" in sys.argv else None

    inferencer = YOLOInference(model_file)
    preds = inferencer.predict(test_img, save_dir=save)

    print(f"\nDetected {len(preds)} pothole(s):")
    for p in preds:
        print(f"  {p['class_name']} | severity={p['severity']} | conf={p['confidence']:.2f}")
