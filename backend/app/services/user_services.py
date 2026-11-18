from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.models.user_auth import UserAuth
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdateProfile
from app.core.security import hash_password


async def get_user(db: AsyncSession, email: str):
    """Retrieves a single user by their email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UserCreate):
    """
    Provisions a new user profile and establishes their linked authentication credentials.
    Enforces a frictionless 2-field signup by deriving the initial full name from the email prefix.
    """
    existing_user = await db.scalar(select(User).where(User.email == user.email))
    if existing_user:
        return None
    
    new_user = User(
        email=user.email,
        full_name=user.email.split('@')[0],
        is_super_admin=False
    )

    db.add(new_user)
    await db.flush() 

    user_auth = UserAuth(
        user_id=new_user.id,
        password_hash=hash_password(user.password),
        auth_provider="email",
        provider_id=None,
    )

    db.add(user_auth)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def update_my_profile(user_data: UserUpdateProfile, db: AsyncSession, current_user: User):
    """Processes self-service profile updates for the authenticated user."""
    update_data = user_data.model_dump(exclude_unset=True)

    if "first_name" in update_data or "last_name" in update_data:
        f_name = update_data.pop("first_name", "")
        l_name = update_data.pop("last_name", "")
        current_user.full_name = f"{f_name} {l_name}".strip()

    for key, value in update_data.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)

    return current_user


async def get_all_users(db: AsyncSession, is_admin: bool):
    """Retrieves the global directory of users. Strictly restricted to Super Admins."""
    if not is_admin: 
        return None

    result = await db.execute(select(User))
    return result.scalars().all()


async def deactivate_user_account(db: AsyncSession, current_user: User):
    """
    Executes a soft-delete on a user account.
    Revokes login access immediately while preserving referential integrity for historical logs.
    """
    current_user.is_active = False
    current_user.deleted_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user