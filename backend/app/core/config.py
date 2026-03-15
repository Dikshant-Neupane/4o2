"""
Application configuration — loads values from .env using pydantic-settings.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),
    )

    # ── Application ─────────────────────────────────────────────
    app_name: str = "AI-Pothole-Detection"
    app_version: str = "1.0.0"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # ── JWT ─────────────────────────────────────────────────────
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ── CORS ────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # ── Database ────────────────────────────────────────────────
    database_url: str = "sqlite:///./civiceye.db"

    # ── Redis / Celery ──────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    celery_task_always_eager: bool = False

    # ── Paths ───────────────────────────────────────────────────
    dataset_dir: str = "./Data"
    model_dir: str = "./models_store"

    # ── Logging ─────────────────────────────────────────────────
    log_level: str = "DEBUG"
    log_file: str = "./logs/app.log"

    @property
    def dataset_path(self) -> Path:
        return Path(self.dataset_dir)

    @property
    def model_path(self) -> Path:
        return Path(self.model_dir)


# Singleton ─ import `settings` from this module everywhere
settings = Settings()
