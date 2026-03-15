"""
Model export utilities for optimised inference.

Supports exporting YOLOv8 models to:
    - ONNX  (cross-platform, TensorRT-compatible)
    - TorchScript (PyTorch-native deployment)
    - Copy best weights to a consolidated ``ai/weights/`` directory
"""

import shutil
from pathlib import Path
from typing import Optional

from loguru import logger

from ai.models.config import DEFAULT_PATHS, INFERENCE_CONFIG


class ModelExporter:
    """
    Exports a trained YOLOv8 model to optimised formats.

    Usage::

        exporter = ModelExporter("runs/detect/pothole_model/weights/best.pt")
        exporter.export_onnx()
        exporter.export_torchscript()
        exporter.copy_to_weights_dir()
    """

    def __init__(self, model_path: str):
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        import torch
        # PyTorch 2.6 security workaround for loading Ultralytics weights
        original_load = torch.load
        def safe_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = safe_load

        from ultralytics import YOLO
        self.model = YOLO(str(self.model_path))

    # ── ONNX Export ────────────────────────────────────────────
    def export_onnx(
        self,
        imgsz: int = INFERENCE_CONFIG["imgsz"],
        simplify: bool = True,
        dynamic: bool = False,
    ) -> str:
        """
        Export model to ONNX format.

        Parameters
        ----------
        imgsz : int
            Image size for the exported model.
        simplify : bool
            Whether to simplify the ONNX graph.
        dynamic : bool
            Enable dynamic input shapes.

        Returns
        -------
        str
            Path to the exported ONNX file.
        """
        logger.info(f"Exporting to ONNX (imgsz={imgsz}, simplify={simplify})")
        export_path = self.model.export(
            format="onnx",
            imgsz=imgsz,
            simplify=simplify,
            dynamic=dynamic,
        )
        logger.info(f"ONNX model exported to: {export_path}")
        return str(export_path)

    # ── TorchScript Export ─────────────────────────────────────
    def export_torchscript(self, imgsz: int = INFERENCE_CONFIG["imgsz"]) -> str:
        """
        Export model to TorchScript format.

        Returns
        -------
        str
            Path to the exported TorchScript file.
        """
        logger.info(f"Exporting to TorchScript (imgsz={imgsz})")
        export_path = self.model.export(
            format="torchscript",
            imgsz=imgsz,
        )
        logger.info(f"TorchScript model exported to: {export_path}")
        return str(export_path)

    # ── Copy to weights directory ──────────────────────────────
    def copy_to_weights_dir(
        self,
        weights_dir: str = DEFAULT_PATHS["weights_dir"],
        filename: str = "pothole_best.pt",
    ) -> str:
        """
        Copy the best model weights to the consolidated weights directory.

        Returns
        -------
        str
            Path to the copied weights file.
        """
        dest_dir = Path(weights_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)

        dest_path = dest_dir / filename
        shutil.copy2(str(self.model_path), str(dest_path))
        logger.info(f"Copied best weights to: {dest_path}")
        return str(dest_path)

    # ── Validate Export ────────────────────────────────────────
    def validate_export(self, format: str = "onnx", test_image: Optional[str] = None) -> bool:
        """
        Quick validation of the exported model by running a test prediction.

        Parameters
        ----------
        format : str
            Export format to validate ("onnx" or "torchscript").
        test_image : str, optional
            Path to a test image. If None, uses a synthetic image.

        Returns
        -------
        bool
            True if the exported model runs successfully.
        """
        import numpy as np

        # Determine exported model path
        stem = self.model_path.stem
        parent = self.model_path.parent
        if format == "onnx":
            export_path = parent / f"{stem}.onnx"
        elif format == "torchscript":
            export_path = parent / f"{stem}.torchscript"
        else:
            logger.error(f"Unknown format: {format}")
            return False

        if not export_path.exists():
            logger.error(f"Exported model not found: {export_path}")
            return False

        try:
            from ultralytics import YOLO
            exported_model = YOLO(str(export_path))

            if test_image and Path(test_image).exists():
                source = test_image
            else:
                # Create a synthetic test image
                source = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)

            results = exported_model.predict(source=source, conf=0.1, verbose=False)
            logger.info(f"Export validation passed for {format}: {len(results)} result(s)")
            return True

        except Exception as e:
            logger.error(f"Export validation failed for {format}: {e}")
            return False


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m ai.export <model_path> [--onnx] [--torchscript] [--copy]")
        sys.exit(1)

    model_file = sys.argv[1]
    flags = sys.argv[2:]

    exporter = ModelExporter(model_file)

    if "--onnx" in flags or not flags:
        onnx_path = exporter.export_onnx()
        exporter.validate_export("onnx")
        print(f"ONNX: {onnx_path}")

    if "--torchscript" in flags:
        ts_path = exporter.export_torchscript()
        exporter.validate_export("torchscript")
        print(f"TorchScript: {ts_path}")

    if "--copy" in flags or not flags:
        weights = exporter.copy_to_weights_dir()
        print(f"Weights copied to: {weights}")
