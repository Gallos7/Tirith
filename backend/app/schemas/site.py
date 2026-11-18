from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SiteBase(BaseModel):
    """Standard properties for provisioning a new Monitored Site (Beacon)."""
    name: str = Field(..., max_length=100)
    url: str = Field(..., max_length=1745)
    check_interval_seconds: int = Field(..., ge=5, le=86400)
    is_active: bool = Field(default=False)


class SiteInfoUpdate(BaseModel):
    """Properties for updating the configuration of an existing site."""
    name: str | None = Field(default=None, max_length=100)
    url: str | None = Field(default=None, max_length=1745)
    check_interval_seconds: int | None = Field(default=None, ge=5, le=86400)
    is_active: bool | None = None


class SiteShow(SiteBase):
    """Read-only response schema containing a site's current telemetry state."""
    id: UUID
    user_id: UUID
    current_status: str 
    last_checked_at: datetime | None
    last_response_time: int | None = None

    model_config = ConfigDict(from_attributes=True)