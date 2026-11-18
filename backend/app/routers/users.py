from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.oauth2 import get_current_user
from app.models.user import User

from app.schemas.user import UserCreate, UserShow, UserUpdateProfile
from app.services import user_services

router = APIRouter()

@router.post("/register", response_model=UserShow, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user account into the system."""
    exists = await user_services.get_user(db, user.email)

    if exists:
        raise HTTPException(status_code=400, detail="Email already registered.")

    return await user_services.create_user(db, user)


@router.get("/profile", response_model=UserShow, status_code=status.HTTP_200_OK)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Retrieves the profile information for the currently authenticated user."""
    return current_user


@router.put("/profile", response_model=UserShow)
async def update_my_profile(
    user_data: UserUpdateProfile, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Allows a user to update their own personal profile information."""
    return await user_services.update_my_profile(user_data=user_data, db=db, current_user=current_user)


@router.get("/admin/get_users", response_model=list[UserShow], status_code=status.HTTP_200_OK)
async def get_all_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves the global directory of all users. Strictly limited to super administrators."""
    users = await user_services.get_all_users(db=db, is_admin=current_user.is_super_admin)

    if not users:
        raise HTTPException(status_code=401, detail="Unauthorized action.")

    return users


@router.delete("/profile", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Initiates a soft-delete on the authenticated user's account.
    Revokes access immediately but preserves relational data.
    """
    await user_services.deactivate_user_account(db=db, current_user=current_user)
    return None