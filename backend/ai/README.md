# AI Module — Pothole Detection & Severity Classification

YOLOv8-based pothole detection system with automatic severity classification.

## Module Structure

```
ai/
├── __init__.py
├── train.py              # Training pipeline
├── inference.py           # Single & batch prediction
├── dataset_loader.py      # YOLO dataset preparation
├── preprocessing.py       # Image resize, normalise, augment
├── evaluate.py            # Metrics, confusion matrix, reports
├── export.py              # ONNX / TorchScript export
├── README.md              # This file
├── models/
│   ├── __init__.py
│   └── config.py          # Centralised configuration
├── weights/
│   └── .gitkeep           # Trained model weights (git-ignored)
└── utils/
    ├── __init__.py
    └── visualization.py   # Drawing and grid utilities
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key packages: `ultralytics`, `torch`, `torchvision`, `opencv-python`, `albumentations`, `matplotlib`, `seaborn`.

### 2. Prepare the Dataset

Place pothole images (`.jpg`) and YOLO label files (`.txt`) in `Data/potholes/`.

Each label file should have lines in YOLO format:
```
class_id center_x center_y width height
```
Example: `0 0.5 0.5 0.3 0.4`

Then run:
```bash
python -m ai.dataset_loader
```

This creates the `datasets/yolo_potholes/` folder with train/val/test splits and a `data.yaml` file.

### 3. Train the Model

```bash
python -m ai.train
```

Or customise via Python:
```python
from ai.train import YOLOTrainer

trainer = YOLOTrainer()
model_path, metrics = trainer.train(
    epochs=50,
    batch_size=16,
    imgsz=640,
)
```

Training outputs are saved to `runs/detect/pothole_model/`. Best weights are automatically copied to `ai/weights/pothole_best.pt`.

### 4. Evaluate the Model

```bash
python -m ai.evaluate runs/detect/pothole_model/weights/best.pt
```

This generates:
- `evaluation_report.json` — Precision, Recall, F1, mAP  
- `confusion_matrix.png` — Visual confusion matrix

### 5. Run Inference

```bash
python -m ai.inference ai/weights/pothole_best.pt path/to/image.jpg --save
```

Or in code:
```python
from ai.inference import YOLOInference

inferencer = YOLOInference("ai/weights/pothole_best.pt")
predictions = inferencer.predict("test.jpg", save_dir="output/")

for p in predictions:
    print(f"{p['class_name']} | severity={p['severity']} | conf={p['confidence']:.2f}")
```

### 6. Export for Deployment

```bash
python -m ai.export ai/weights/pothole_best.pt --onnx --copy
```

Supported formats: ONNX, TorchScript.

## Severity Classification

Severity is inferred from the bounding-box area as a fraction of the image area:

| Severity | Area Ratio | Colour |
|----------|-----------|--------|
| Minor    | < 5%      | Green  |
| Moderate | 5–15%     | Orange |
| Severe   | ≥ 15%     | Red    |

Thresholds are configurable in `ai/models/config.py`.

## Configuration

All hyperparameters are centralised in `ai/models/config.py`:
- **TRAIN_CONFIG** — epochs, batch size, learning rate, patience
- **INFERENCE_CONFIG** — confidence threshold, IoU threshold
- **AUGMENTATION_CONFIG** — flip, rotation, brightness, noise
- **SEVERITY_THRESHOLDS** — area-ratio boundaries
- **SPLIT_RATIOS** — train/val/test split fractions

## End-to-End Pipeline Test

```bash
python test_pipeline.py
```

This runs dataset loading → training (3 epochs) → evaluation in one go.

## API Integration

The AI module integrates with the FastAPI backend via:
- `app/services/training_pipeline.py` — Celery task for background training
- `app/services/inference.py` — Prediction endpoint service
- `app/api/ai_routes.py` — REST API routes
