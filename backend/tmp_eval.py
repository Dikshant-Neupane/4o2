import os
import sys

# Add backend to path so imports work
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from ai.train import YOLOTrainer
from ai.evaluate import YOLOEvaluator

from ai.models.config import TRAIN_CONFIG

def main():
    print("Starting Training...")
    trainer = YOLOTrainer()
    model_path, train_metrics = trainer.train(
        epochs=TRAIN_CONFIG["epochs"],
        imgsz=TRAIN_CONFIG["imgsz"],
        name="pothole_optimized_eval"
    )
    
    print("\nStarting Evaluation...")
    evaluator = YOLOEvaluator(model_path)
    eval_metrics = evaluator.evaluate()
    
    print("\n--- RESULTS ---")
    print(f"Training Metrics: {train_metrics}")
    print(f"Evaluation Metrics: {eval_metrics}")

if __name__ == "__main__":
    main()
