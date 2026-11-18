from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.core.oauth2 import get_current_user
from app.models.user import User

from app.schemas.site import SiteBase, SiteInfoUpdate, SiteShow
from app.services import sites_service

router = APIRouter()

# --- Core Site Management ---

@router.post("/create", response_model=SiteShow, status_code=status.HTTP_201_CREATED)
async def create_new_site(
    site_data: SiteBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers a new domain or IP address for the background worker to monitor."""
    site = await sites_service.create_site(site=site_data, db=db, current_user=current_user)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="A site with this name already exists in your account."
        )
    return site


@router.get("/get_all", response_model=list[SiteShow])
async def read_all_sites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all sites configured by the authenticated user."""
    sites = await sites_service.get_all_sites(db=db, current_user=current_user)
    return sites


@router.get("/get_one/{site_id}", response_model=SiteShow)
async def read_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the configuration for a specific monitored site."""
    site = await sites_service.get_site(site_id=site_id, db=db, current_user=current_user)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Site not found or access denied."
        )
    return site


@router.put("/update/{site_id}", response_model=SiteShow)
async def update_existing_site(
    site_id: UUID,
    site_data: SiteInfoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modifies the polling configuration or URL for an existing site."""
    site = await sites_service.update_site(site_id=site_id, site_data=site_data, db=db, current_user=current_user)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Site not found or access denied."
        )
    return site


@router.delete("/delete/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently deletes a site and all associated telemetry logs."""
    success = await sites_service.delete_site(site_id=site_id, db=db, current_user=current_user)

    if not success or isinstance(success, dict): 
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Site not found or access denied."
        )
    return None


# --- Telemetry & Analytics ---

@router.get("/{site_id}/uptime", tags=["Sites Telemetry"])
async def get_uptime(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculates the rolling uptime percentage for the specified site."""
    result = await sites_service.uptime(site_id, db, current_user)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    return result


@router.get("/{site_id}/graph-data", tags=["Sites Telemetry"])
async def get_site_graph_data(
    site_id: UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Aggregates chronological response time data for frontend charting."""
    result = await sites_service.graph_data(site_id, db, current_user)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    
    return result