from uuid import UUID
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.models.user import User
from app.models.ping_log import PingLog
from app.models.sites import MonitoredSite

from app.schemas.ping_log import PingLogCreate


async def create_ping_log(db: AsyncSession, ping_data: PingLogCreate):
    """
    Records a telemetry heartbeat and updates the parent site's current status.
    Called directly by the background worker process.
    """
    new_ping = PingLog(
        site_id=ping_data.site_id,
        is_up=ping_data.is_up,
        response_time=ping_data.response_time,
        status_code=ping_data.status_code,
        error_message=ping_data.error_message
    )

    db.add(new_ping)
    await db.flush()

    parent_site = await db.scalar(select(MonitoredSite).where(MonitoredSite.id == ping_data.site_id))

    if parent_site:
        parent_site.current_status = "up" if ping_data.is_up else "down"
        parent_site.last_checked_at = datetime.now(timezone.utc)
    else:
        return {"status": "Something went wrong when fetching!"}

    await db.commit()
    await db.refresh(new_ping)

    return new_ping


async def get_site_ping_logs(db: AsyncSession, site_id: UUID, current_user: User):
    """
    Retrieves the chronological heartbeat history for a specific site.
    
    Security note: If ownership validation fails, this function intentionally returns `None`
    (simulating a 404 Not Found) rather than an explicit 403 Forbidden. This prevents 
    Information Exposure attacks (CWE-208) by obscuring whether the UUID actually exists 
    in the system from malicious actors.
    """
    ownership = await db.scalar(
        select(MonitoredSite).where(
            MonitoredSite.user_id == current_user.id, 
            MonitoredSite.id == site_id
        )
    )

    if not ownership:
        return None

    ping_list = await db.execute(
        select(PingLog)
        .where(PingLog.site_id == site_id)
        .order_by(desc(PingLog.created_at))
    )

    return ping_list.scalars().all()