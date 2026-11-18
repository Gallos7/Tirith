import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class User(Base):
    """
    Represents a Watcher (User) in Project Tirith.
    
    Contains core profile data and timezone preferences for telemetry alerting. 
    Sensitive security data (hashed passwords) is strictly delegated to the 1-to-1 UserAuth table.
    """
    __tablename__ = "users"

    # --- Primary Key ---
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        index=True, 
        default=uuid.uuid4
    )
    
    # --- Core Data ---
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), index=True)
    is_super_admin = mapped_column(Boolean, default=False)
    is_active = mapped_column(Boolean, default=True)
    deleted_at = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    avatar_url: Mapped[str | None] = mapped_column(String(255))
    
    # --- Application Preferences ---
    timezone: Mapped[str] = mapped_column(String(50), server_default="UTC")

    # --- Relationships ---
    sites: Mapped[list["MonitoredSite"]] = relationship(
        "MonitoredSite",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    auth: Mapped["UserAuth"] = relationship(
        "UserAuth",
        back_populates="user",
        cascade="all, delete-orphan"
    )