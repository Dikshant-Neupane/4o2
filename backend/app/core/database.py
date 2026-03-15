"""
SQLAlchemy database engine, session factory, and declarative Base.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# ── Engine ──────────────────────────────────────────────────────
_is_sqlite = settings.database_url.startswith("sqlite")

_engine_kwargs = dict(
    echo=settings.debug,
)

if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    _engine_kwargs.update(pool_pre_ping=True, pool_size=5, max_overflow=10)

from loguru import logger

engine = create_engine(settings.database_url, **_engine_kwargs)

logger.info("Database: {}", "SQLite (civiceye.db)" if _is_sqlite else settings.database_url)

# ── Session factory ─────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Declarative Base ────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def init_db() -> None:
    """Create all tables (development convenience — use Alembic in prod)."""
    # Import all model modules so Base.metadata knows about them
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
