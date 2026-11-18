import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class UserAuth(Base):
    """
    Manages the secure authentication credentials for a Watcher (User).
    
    Strictly isolates sensitive security data, such as hashed passwords, reset tokens, 
    and session lockouts, from the public user profile via a 1-to-1 relationship.
    """
    __tablename__ = "user_auth"

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

    # --- Authentication Credentials ---
    auth_provider: Mapped[str] = mapped_column(String(50), default="local")
    password_hash: Mapped[str | None] = mapped_column(String(255))
    provider_id: Mapped[str | None] = mapped_column(String(255))

    # --- Session Management ---
    refresh_token: Mapped[str | None] = mapped_column(String(500))  # Enables secure session revocation
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- Security & Lockout Policies ---
    required_password_change: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, default=None)

    # --- Password Reset Flow ---
    reset_token: Mapped[str | None] = mapped_column(String(255), index=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # --- Relationships ---
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="auth"
    )