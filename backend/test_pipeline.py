import asyncio
import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.api.deps import get_db
from ai.dataset_loader import YOLODataLoader
from ai.train import YOLOTrainer

# Force stdout flush for real-time printing
sys.stdout.reconfigure(line_buffering=True)

def print_header(msg):
    print(f"\n{'='*60}")
    print(f"[*] {msg}")
    print(f"{'='*60}\n")

def print_step(step_num, msg):
    print(f"-> [Step {step_num}] {msg}")

def print_success(msg):
    print(f"[OK] {msg}")

def main():
    print_header("STARTING AI PIPELINE VISUAL TEST")

    dataset_dir = "Data/potholes"
    
    print_step(1, "Initializing YOLOv8 Pipeline...")
    loader = YOLODataLoader(source_dir=dataset_dir, output_dir="datasets/yolo_test_run")
    yaml_path = loader.prepare_dataset(split_ratio=(0.8, 0.2, 0.0))
    print_success("YOLO Dataset Generated successfully")

    print_step(2, "Running End-to-End YOLOv8 Training...")
    start_time = time.time()
    
    try:
        trainer = YOLOTrainer(data_yaml_path=str(yaml_path), model_type="yolov8n.pt", project_dir="runs/detect")
        model_path, metrics = trainer.train(epochs=3, batch_size=8)
        
        duration = time.time() - start_time
        print("\n")
        print_success(f"Training Completed in {duration:.2f} seconds!")
        
        print_header("[*] PIPELINE RESULTS")
        print(f"Model File Path:  {model_path}")
        print(f"mAP50:            {metrics.get('mAP50', 0)*100:.2f}%")
        print(f"mAP50-95:         {metrics.get('mAP50-95', 0)*100:.2f}%")
        print(f"Precision:        {metrics.get('precision', 0)*100:.2f}%")
        print(f"Recall:           {metrics.get('recall', 0)*100:.2f}%")
        
    except Exception as e:
        print(f"\n[ERROR] Pipeline failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
