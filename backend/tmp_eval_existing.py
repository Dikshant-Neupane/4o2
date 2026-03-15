import os
from pathlib import Path

# Add backend to path so imports work
import sys
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from ai.evaluate import YOLOEvaluator

# Find best model
model_path = Path('runs/detect/pothole_model/weights/best.pt')
if not model_path.exists():
    models_store = Path('models_store')
    if models_store.exists():
        models = list(models_store.glob('*.pt'))
        if models:
            # Get latest modified model
            model_path = max(models, key=os.path.getmtime)

print(f'Evaluating model: {model_path}')

if model_path.exists():
    evaluator = YOLOEvaluator(str(model_path))
    metrics = evaluator.evaluate()
    print('\n--- ACCURACY METRICS ---')
    print(f"mAP@50 (Accuracy): {metrics['mAP50'] * 100:.2f}%")
    print(f"mAP@50-95: {metrics['mAP50_95'] * 100:.2f}%")
    print(f"Precision: {metrics['precision'] * 100:.2f}%")
    print(f"Recall: {metrics['recall'] * 100:.2f}%")
    print(f"F1 Score: {metrics['f1_score'] * 100:.2f}%")
else:
    print('No trained model found to evaluate.')
