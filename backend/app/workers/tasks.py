"""
Celery background tasks for AI model training — Phase 2.
"""

import json
import traceback

from loguru import logger

from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.model_service import ModelService
from app.core.config import settings


@celery_app.task(bind=True, name="train_model_task", max_retries=2)
def train_model_task(
    self,
    training_run_id: int,
    epochs: int = 10,
    learning_rate: float = 1e-3,
    batch_size: int = 16,
) -> dict:
    """
    Execute a full model training pipeline as a background task.

    Args:
        training_run_id: ID of the TrainingRun record.
        epochs: Number of training epochs.
        learning_rate: Learning rate for optimizer.
        batch_size: Batch size for DataLoaders.

    Returns:
        dict with training metrics.
    """
    db = SessionLocal()
    try:
        service = ModelService(db)

        # Mark as running
        run = service.update_training_status(training_run_id, status="running")
        dataset = run.dataset

        logger.info(
            "Task: training run #{} — model={}, dataset='{}', epochs={}",
            training_run_id,
            run.model_type,
            dataset.name,
            epochs,
        )

        # Run YOLO pipeline
        from ai.dataset_loader import YOLODataLoader
        from ai.train import YOLOTrainer
        import shutil
        from pathlib import Path

        # Prepare YOLO dataset
        loader = YOLODataLoader(source_dir=dataset.file_path, output_dir=f"datasets/yolo_run_{training_run_id}")
        yaml_path = loader.prepare_dataset()

        # Train model
        trainer = YOLOTrainer(
            data_yaml_path=str(yaml_path), 
            model_type=run.model_type if run.model_type and run.model_type != 'resnet18' else "yolov8n.pt", 
            project_dir=str(settings.model_path / "yolo_runs")
        )
        best_model_path, metrics = trainer.train(epochs=epochs, batch_size=batch_size)

        # Versioning Integration
        from app.services.model_versioning import ModelVersioning
        versioning = ModelVersioning(str(settings.model_path))
        version = versioning.get_latest_version()
        new_version = (version or 0) + 1
        
        new_model_name = f"model_v{new_version}.pt"
        new_model_path = Path(settings.model_path) / new_model_name
        shutil.copy(best_model_path, new_model_path)

        metadata = {
            "version": new_version,
            "metrics": metrics,
            "hyperparams": {"epochs": epochs, "batch_size": batch_size, "model": trainer.model_type},
            "dataset_info": str(dataset.file_path),
            "created_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
        }
        with open(Path(settings.model_path) / f"model_v{new_version}_meta.json", "w") as f:
            json.dump(metadata, f, indent=4)

        metrics["model_path"] = str(new_model_path)
        metrics["model_version"] = new_version

        # Sanitize metrics for JSON serialization
        serializable_metrics = {
            k: v for k, v in metrics.items()
            if isinstance(v, (int, float, str, list, dict, bool, type(None)))
        }

        # Mark as completed
        service.update_training_status(
            training_run_id,
            status="completed",
            metrics=serializable_metrics,
        )
        logger.info("Task: training run #{} completed ✓", training_run_id)
        return serializable_metrics

    except Exception as exc:
        logger.error("Task: training run #{} failed — {}", training_run_id, exc)
        try:
            service.update_training_status(
                training_run_id,
                status="failed",
                error_message=traceback.format_exc(),
            )
        except Exception:
            pass
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


@celery_app.task(name="preprocess_dataset_task")
def preprocess_dataset_task(dataset_path: str) -> dict:
    """
    Preprocess a dataset as a background task.

    Args:
        dataset_path: Path to the dataset directory.

    Returns:
        dict with preprocessing summary.
    """
    logger.info("Preprocessing dataset at {}", dataset_path)

    from app.services.data_preprocessing import ImagePreprocessor

    try:
        preprocessor = ImagePreprocessor(data_dir=dataset_path)
        preprocessor.load_images()
        X_train, X_val, X_test, y_train, y_val, y_test = preprocessor.split_data()

        result = {
            "status": "completed",
            "total_images": len(preprocessor.image_paths),
            "train_size": len(X_train),
            "val_size": len(X_val),
            "test_size": len(X_test),
            "class_distribution": {
                "pothole": sum(1 for l in preprocessor.labels if l == 1),
                "normal": sum(1 for l in preprocessor.labels if l == 0),
            },
        }
        logger.info("Preprocessing complete: {}", result)
        return result

    except Exception as exc:
        logger.error("Preprocessing failed: {}", exc)
        return {"status": "failed", "error": str(exc)}
