"""
File-system utility helpers.
"""

import os
from pathlib import Path
from typing import Optional


IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


def list_image_files(directory: str | Path) -> list[Path]:
    """Recursively list all image files in a directory."""
    directory = Path(directory)
    return sorted(
        f
        for f in directory.rglob("*")
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )


def count_files(directory: str | Path, extensions: Optional[set[str]] = None) -> int:
    """Count files in a directory, optionally filtered by extension."""
    directory = Path(directory)
    count = 0
    for f in directory.rglob("*"):
        if f.is_file():
            if extensions is None or f.suffix.lower() in extensions:
                count += 1
    return count


def get_directory_info(directory: str | Path) -> dict:
    """Return summary info about a directory."""
    directory = Path(directory)
    if not directory.exists():
        return {"exists": False}

    files = list(directory.rglob("*"))
    total_files = sum(1 for f in files if f.is_file())
    total_size = sum(f.stat().st_size for f in files if f.is_file())
    extensions = {f.suffix.lower() for f in files if f.is_file() and f.suffix}

    return {
        "exists": True,
        "path": str(directory.resolve()),
        "total_files": total_files,
        "total_size_mb": round(total_size / 1e6, 2),
        "extensions": sorted(extensions),
    }


def ensure_directory(path: str | Path) -> Path:
    """Create a directory (and parents) if it doesn't exist."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p
