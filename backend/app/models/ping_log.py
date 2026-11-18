import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class PingLog(Base):
    """
    The permanent ledger of Project Tirith.
    
    Records the individual heartbeat telemetry (uptime, response times, and error codes) 
    for every Monitored Site. This table is optimized for massive write volume and rapid querying.
    """
    __tablename__ = "ping_logs"

    # --- Primary Key & Foreign Key ---
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4
    )

    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id"),
        index=True,
        nullable=False
    )

    # --- Telemetry Data ---
    status_code: Mapped[int | None] = mapped_column(Integer)
    response_time: Mapped[int | None] = mapped_column(Integer)
    is_up: Mapped[bool] = mapped_column(Boolean, index=True, default=True)
    error_message: Mapped[str | None] = mapped_column(String(255))

    # --- Relationships ---
    site: Mapped["MonitoredSite"] = relationship(
        "MonitoredSite",
        back_populates="logs"
    )