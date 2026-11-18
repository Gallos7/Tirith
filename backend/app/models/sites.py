import uuid
from sqlalchemy import DateTime
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class MonitoredSite(Base):
    """
    Represents a Beacon (Monitored Site) actively watched by Project Tirith.
    
    Stores the target URL and configuration settings (like check intervals) 
    for a specific service that a Watcher (User) wants to keep online.
    """
    __tablename__ = "sites"

    # --- Primary Key & Foreign Key ---
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
        nullable=False
    )

    # --- Core Data ---
    name: Mapped[str] = mapped_column(String(100), index=True)
    url: Mapped[str] = mapped_column(String(1745), index=True)

    # --- Settings ---
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    check_interval_seconds: Mapped[int] = mapped_column(Integer, default=60)
    current_status: Mapped[str] = mapped_column(String(20), default="pending")
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_response_time: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # --- Relationships ---
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="sites"
    )

    logs: Mapped[list["PingLog"]] = relationship(
        "PingLog",
        back_populates="site",
        cascade="all, delete-orphan"
    )