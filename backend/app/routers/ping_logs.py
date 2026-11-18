from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.oauth2 import get_current_user
from app.models.user import User

from app.schemas.ping_log import PingLogShow, PingLogCreate
from app.services import ping_log_services

router = APIRouter()

@router.get("/get_one/{site_id}/logs", response_model=list[PingLogShow])
async def read_site_logs(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the chronological telemetry heartbeat history for a specific site.
    Powers the 24-hour response time and uptime charts on the frontend.
    """
    logs = await ping_log_services.get_site_ping_logs(
        db=db, 
        site_id=site_id, 
        current_user=current_user
    )
    
    if logs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Site not found or access denied."
        )
        
    return logs


@router.post("/test_create", response_model=PingLogShow)
async def test_create_log(
    ping_data: PingLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    TEMPORARY ENDPOINT: Used only for manually simulating a worker ping during development.
    Must be removed prior to production deployment.
    """
    new_log = await ping_log_services.create_ping_log(db=db, ping_data=ping_data)
    
    if isinstance(new_log, dict):
        raise HTTPException(status_code=400, detail=new_log["status"])
        
    return new_log