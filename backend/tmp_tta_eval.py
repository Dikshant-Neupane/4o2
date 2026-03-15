import os
import sys
from pathlib import Path
from loguru import logger

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from ai.evaluate import YOLOEvaluator

def main():
    model_path = Path('runs/detect/pothole_optimized_eval/weights/best.pt')
    if not model_path.exists():
        print(f"Model not found at {model_path}")
        return

    print("Evaluating model with Test-Time Augmentation (TTA)...")
    evaluator = YOLOEvaluator(str(model_path))
    
    # We pass augment=True internally via evaluate() loading from INFERENCE_CONFIG
    metrics = evaluator.evaluate(split="test", imgsz=480)
    
    print("\n--- TTA FINAL RESULTS ---")
    print(f"mAP@50 (Accuracy): {metrics['mAP50'] * 100:.2f}%")
    print(f"mAP@50-95: {metrics['mAP50_95'] * 100:.2f}%")
    print(f"Precision: {metrics['precision'] * 100:.2f}%")
    print(f"Recall: {metrics['recall'] * 100:.2f}%")
    print(f"F1 Score: {metrics['f1_score'] * 100:.2f}%")

if __name__ == "__main__":
    main()
