"""
SQLAlchemy declarative base configuration for Project Tirith.
Centralizes the Base class to prevent circular import dependencies across different models.
"""
from datetime import datetime
from sqlalchemy import MetaData, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


# Naming convention for clean, predictable constraint names in Postgres migrations.
# This prevents Alembic crashes when dropping or altering columns later.
POSTGRES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}


class Base(DeclarativeBase):
    """The master declarative base for all Tirith database tables."""

    # Apply the naming convention to the Base metadata
    metadata = MetaData(naming_convention=POSTGRES_NAMING_CONVENTION)

    # Universal Timestamps (inherited automatically by every model like User, MonitoredSite, etc.)
    # We enforce timezone=True so Postgres knows exactly when an event happened globally.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )