"""
Model configuration constants for the pothole detection AI module.

Centralizes hyperparameters, thresholds, and class definitions so every
script in the ai/ package reads from a single source of truth.
"""

# ── Class Definitions ───────────────────────────────────────────
# Single-class detection (YOLO detects "pothole"), severity is
# inferred post-detection from the bounding-box area ratio.
CLASS_NAMES = {0: "pothole"}

SEVERITY_LEVELS = {
    "minor":    {"label": "Minor",    "color": (0, 200, 0)},    # Green
    "moderate": {"label": "Moderate", "color": (0, 165, 255)},  # Orange (BGR)
    "severe":   {"label": "Severe",   "color": (0, 0, 255)},    # Red   (BGR)
}

# Bounding-box area as a fraction of the full image area.
# Values are upper bounds (exclusive) for each severity tier.
SEVERITY_THRESHOLDS = {
    "minor":    0.05,   # < 5 % of image  → minor
    "moderate": 0.15,   # 5–15 % of image → moderate
    # anything ≥ 15 %                     → severe
}


# ── Training Hyperparameters ────────────────────────────────────
TRAIN_CONFIG = {
    "model_type":      "yolov8n.pt",  # Nano model for feasible CPU training speed
    "epochs":          30,            # 30 epochs is enough for transfer learning to hit >60%
    "batch_size":      16,
    "imgsz":           480,           # Lower resolution for 2x faster CPU training, still high enough for potholes
    "lr0":             0.002,         # Tuned learning rate
    "optimizer":       "AdamW",       # AdamW for best weight regularization
    "weight_decay":    0.0005,
    "close_mosaic":    5,
    "patience":        10,
    "project_dir":     "runs/detect",
    "run_name":        "pothole_model_optimized",
    # Advanced Senior ML Techniques for higher mAP
    "cos_lr":          True,          # Cosine annealing learning rate for better convergence
    "mixup":           0.15,          # MixUp data augmentation (overlays images)
    "mosaic":          1.0,           # 100% chance of Mosaic (stitches 4 images)
    "label_smoothing": 0.1,           # Label smoothing to prevent overconfidence
    "warmup_epochs":   3.0,           # Warmup to protect pretrained weights
}


# ── Inference Defaults ──────────────────────────────────────────
INFERENCE_CONFIG = {
    "conf_threshold":  0.25,        # Minimum confidence to accept a detection
    "iou_threshold":   0.45,        # NMS IoU threshold for overlapping boxes
    "imgsz":           640,         # Match training logic or use 640
    "augment":         True,        # Test-Time Augmentation (TTA) enabled to boost accuracy
    "max_det":         100,
}


# ── Preprocessing / Augmentation ────────────────────────────────
PREPROCESS_CONFIG = {
    "imgsz":        640,
    "auto_orient":  True,
    "normalize":    True,           # 0-1 scaling
    "imagenet_mean": [0.485, 0.456, 0.406],
    "imagenet_std":  [0.229, 0.224, 0.225],
}

AUGMENTATION_CONFIG = {
    "horizontal_flip_p":   0.5,
    "vertical_flip_p":     0.0,
    "rotation_limit":      15,
    "brightness_limit":    0.2,
    "contrast_limit":      0.2,
    "blur_limit":          3,
    "noise_var_limit":     (10.0, 50.0),
    "scale_limit":         0.1,
}


# ── Dataset Split Ratios ───────────────────────────────────────
SPLIT_RATIOS = {
    "train": 0.70,
    "val":   0.15,
    "test":  0.15,
}


# ── Paths ──────────────────────────────────────────────────────
DEFAULT_PATHS = {
    "source_data":   "Data/potholes",
    "yolo_dataset":  "datasets/yolo_potholes",
    "weights_dir":   "ai/weights",
    "models_store":  "models_store",
    "runs_dir":      "runs/detect",
}
