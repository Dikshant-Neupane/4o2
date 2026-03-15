"""
Visualization utilities for pothole detection results.

Provides severity-aware bounding box drawing, batch visualization grids,
and convenience functions for quick demos.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Optional

from ai.models.config import SEVERITY_LEVELS


# ── Severity colour mapping ────────────────────────────────────
def _severity_color(severity: str) -> tuple[int, int, int]:
    """Return BGR colour for a given severity level."""
    info = SEVERITY_LEVELS.get(severity, SEVERITY_LEVELS["minor"])
    return info["color"]


# ── Core drawing functions ─────────────────────────────────────
def draw_bounding_boxes(
    image: np.ndarray,
    boxes: list,
    confidences: list,
    classes: list,
    class_names: dict,
) -> np.ndarray:
    """
    Draw bounding boxes and labels on an image (legacy API).

    Parameters
    ----------
    image : np.ndarray  (H, W, 3) BGR
    boxes : list of [x1, y1, x2, y2]
    confidences : list of float
    classes : list of int
    class_names : dict mapping class_id → name
    """
    img = image.copy()

    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box)
        conf = confidences[i]
        cls_id = int(classes[i])
        cls_name = class_names.get(cls_id, str(cls_id))

        color = (0, 0, 255)  # Default red

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        label = f"{cls_name} {conf:.2f}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, y1 - 20), (x1 + w, y1), color, -1)
        cv2.putText(img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    return img


def draw_detections(
    image: np.ndarray,
    predictions: list[dict],
    show_severity: bool = True,
) -> np.ndarray:
    """
    Draw detection results with severity-coded colours.

    Parameters
    ----------
    image : np.ndarray  (H, W, 3) BGR
    predictions : list of dict
        Each dict should contain: box, confidence, class_name, severity.
    show_severity : bool
        If True, colour boxes by severity; otherwise use red.

    Returns
    -------
    np.ndarray
        Annotated image.
    """
    img = image.copy()

    for pred in predictions:
        x1, y1, x2, y2 = map(int, pred["box"])
        conf = pred["confidence"]
        cls_name = pred.get("class_name", "pothole")
        severity = pred.get("severity", "minor")

        color = _severity_color(severity) if show_severity else (0, 0, 255)

        # Draw box
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        # Label with severity
        label = f"{cls_name} ({severity}) {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw, y1), color, -1)
        cv2.putText(
            img, label, (x1, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1,
        )

    return img


def create_visualization_grid(
    images: list[np.ndarray],
    predictions_list: list[list[dict]],
    grid_cols: int = 3,
    cell_size: int = 320,
) -> np.ndarray:
    """
    Create a grid of annotated images for batch visualization.

    Parameters
    ----------
    images : list of np.ndarray
        Original images (BGR).
    predictions_list : list of list of dict
        Predictions for each image.
    grid_cols : int
        Number of columns in the grid.
    cell_size : int
        Width/height of each cell in pixels.

    Returns
    -------
    np.ndarray
        Grid image.
    """
    n = len(images)
    grid_rows = (n + grid_cols - 1) // grid_cols

    grid = np.full(
        (grid_rows * cell_size, grid_cols * cell_size, 3),
        255, dtype=np.uint8,
    )

    for idx in range(n):
        annotated = draw_detections(images[idx], predictions_list[idx])
        resized = cv2.resize(annotated, (cell_size, cell_size))

        row = idx // grid_cols
        col = idx % grid_cols
        y_start = row * cell_size
        x_start = col * cell_size
        grid[y_start : y_start + cell_size, x_start : x_start + cell_size] = resized

    return grid


def visualize_detections(
    image_path: str,
    predictions: list[dict],
    output_path: Optional[str] = None,
    show: bool = False,
) -> np.ndarray:
    """
    Convenience function: load image, draw detections, optionally save/show.

    Parameters
    ----------
    image_path : str
        Path to the input image.
    predictions : list of dict
        Detection predictions from YOLOInference.predict().
    output_path : str, optional
        If provided, save the annotated image to this path.
    show : bool
        If True, display the image in an OpenCV window.

    Returns
    -------
    np.ndarray
        Annotated image.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    annotated = draw_detections(img, predictions)

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_path), annotated)

    if show:
        cv2.imshow("Pothole Detections", annotated)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return annotated
