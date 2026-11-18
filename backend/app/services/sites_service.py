from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta
from uuid import UUID

from app.models.sites import MonitoredSite
from app.models.ping_log import PingLog
from app.models.user import User

from app.schemas.site import SiteBase, SiteInfoUpdate


# --- Core Site Management ---

async def create_site(site: SiteBase, db: AsyncSession, current_user: User):
    """
    Provisions a new monitored site for the authenticated user.
    Enforces uniqueness on the site name per-user to prevent duplicate tracking.
    """
    existing_site = await db.scalar(
        select(MonitoredSite).where(
            MonitoredSite.user_id == current_user.id, 
            MonitoredSite.name == site.name
        )
    )
    if existing_site:
        return None

    new_site = MonitoredSite(
        user_id=current_user.id,
        name=site.name,
        url=site.url,
        check_interval_seconds=site.check_interval_seconds,
        is_active=site.is_active
    )

    db.add(new_site)
    await db.commit()
    await db.refresh(new_site)

    return new_site


async def get_site(site_id: UUID, db: AsyncSession, current_user: User):
    """Retrieves a single monitored site, enforcing ownership constraints."""
    site = await db.scalar(
        select(MonitoredSite).options(
            joinedload(MonitoredSite.owner),
        ).filter(
            MonitoredSite.id == site_id, 
            MonitoredSite.user_id == current_user.id
        )
    )

    if not site:
        return None

    return site


async def get_all_sites(db: AsyncSession, current_user: User):
    """
    Retrieves all sites configured by the authenticated user.
    Bypasses tenant isolation if requested by a Super Admin.
    """
    if current_user.is_super_admin:
        result = await db.execute(select(MonitoredSite))
        return result.scalars().all()

    sites = await db.execute(select(MonitoredSite).where(MonitoredSite.user_id == current_user.id))

    return sites.scalars().all()


async def update_site(site_id: UUID, site_data: SiteInfoUpdate, db: AsyncSession, current_user: User):
    """Modifies the configuration of an existing site, utilizing exclude_unset for partial updates."""
    site = await get_site(site_id=site_id, db=db, current_user=current_user)
    if not site:
        return None

    updated_data = site_data.model_dump(exclude_unset=True)

    for key, value in updated_data.items():
        setattr(site, key, value)

    await db.commit()
    await db.refresh(site)

    return site


async def delete_site(site_id: UUID, db: AsyncSession, current_user: User):
    """
    Permanently deletes a site.
    Relies on SQLAlchemy cascade configuration to automatically purge all associated PingLogs.
    """
    site = await db.scalar(
        select(MonitoredSite).where(
            MonitoredSite.id == site_id, 
            MonitoredSite.user_id == current_user.id
        )
    )

    if not site:
        return False

    await db.delete(site)
    await db.commit()

    return True


# --- Telemetry & Analytics ---

async def uptime(site_id: UUID, db: AsyncSession, current_user: User):
    """
    Calculates the 24-hour rolling uptime percentage.
    Utilizes SQL aggregation functions (COUNT) directly in Postgres for performance, 
    rather than loading massive arrays of logs into Python memory.
    """
    existing_site = await db.scalar(
        select(MonitoredSite).where(
            MonitoredSite.user_id == current_user.id, 
            MonitoredSite.id == site_id
        )
    )
    if not existing_site:
        return None

    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)

    query = select(func.count(PingLog.id)).where(
        PingLog.site_id == site_id,
        PingLog.created_at >= yesterday
    )
    total_logs = await db.scalar(query)

    if not total_logs:
        return {"uptime_percentage": 0}

    up_query = select(func.count(PingLog.id)).where(
        PingLog.site_id == site_id,
        PingLog.created_at >= yesterday,
        PingLog.is_up == True
    )
    up_logs = await db.scalar(up_query)

    uptime_percentage = round((up_logs / total_logs) * 100, 2)

    return {"uptime_percentage": uptime_percentage}


async def graph_data(site_id: UUID, db: AsyncSession, current_user: User):
    """
    Aggregates chronological response time data for the last 24 hours.
    Formats the payload specifically for immediate consumption by the React frontend charting library.
    """
    existing_site = await db.scalar(
        select(MonitoredSite).where(
            MonitoredSite.user_id == current_user.id, 
            MonitoredSite.id == site_id
        )
    )
    if not existing_site:
        return None

    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)

    query = select(PingLog.created_at, PingLog.response_time).where(
        PingLog.site_id == site_id,
        PingLog.created_at >= yesterday
    ).order_by(PingLog.created_at.asc())

    results = await db.execute(query)
    rows = results.all()

    chart_data = [
        {"timestamp": row.created_at, "response_time": row.response_time} 
        for row in rows
    ]

    return chart_data