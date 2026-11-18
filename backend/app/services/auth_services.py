import secrets, uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_auth import UserAuth

from app.core.oauth2 import create_access_token, create_refresh_token, verify_refresh_token
from app.core.security import hash_password, send_email_code, verify_password


# --- Authentication & Tokens ---

async def login(email: str, password: str, db: AsyncSession):
    """
    Authenticates a user and provisions JWT session tokens.
    Enforces soft-deletion checks and brute-force lockout policies.
    """
    user = await db.scalar(select(User).options(
        joinedload(User.auth)
    ).filter(User.email == email))

    if not user or not user.auth:
        return {"status": "invalid_credentials"}

    if not user.is_active:
        return {"status": "deactivated"}

    now = datetime.now(timezone.utc)

    # Brute-force lockout verification
    if user.auth.locked_until and user.auth.locked_until > now:
        return {"status": "locked"}

    # Password cryptographic verification
    if not verify_password(password, user.auth.password_hash):
        user.auth.failed_login_attempts += 1
        if user.auth.failed_login_attempts >= 4:
            user.auth.locked_until = now + timedelta(minutes=15)
        await db.commit()
        return {"status": "invalid_credentials"}

    # Successful Authentication: Reset security triggers
    user.auth.failed_login_attempts = 0
    user.auth.locked_until = None

    if user.auth.required_password_change:
        await db.commit()
        return {"status": "requires_password_change", "user_id": str(user.id)}

    access_token = create_access_token(data={"user_id": str(user.id)})
    refresh_token = create_refresh_token(data={"user_id": str(user.id)})

    user.auth.refresh_token = refresh_token
    await db.commit()

    return {
        "status": "success",
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }


async def refresh_access_token(refresh_token: str, db: AsyncSession):
    """
    Issues a new access token using a valid, non-revoked refresh token.
    Re-evaluates account active status during token issuance.
    """
    user_id_str = verify_refresh_token(refresh_token)
    
    if not user_id_str:
        return {"status": "invalid_token"}
        
    # Convert the decoded string back into a UUID object for SQLAlchemy
    try:
        parsed_user_id = uuid.UUID(user_id_str)
    except ValueError:
        return {"status": "invalid_token"}
        
    # Use parsed_user_id in the database query
    user = await db.scalar(select(User).options(
        joinedload(User.auth)
    ).filter(User.id == parsed_user_id))
    
    if not user or not user.auth or user.auth.refresh_token != refresh_token:
        return {"status": "revoked"}
    
    if not user.is_active:
        return {"status": "deactivated"}
        
    new_access_token = create_access_token(data={"user_id": str(user.id)})
    
    return {
        "status": "success",
        "access_token": new_access_token, 
        "token_type": "bearer"
    }


async def logout(db: AsyncSession, current_user: User):
    """Terminates the user session by destroying the active refresh token."""
    user_auth = await db.scalar(select(UserAuth).filter(UserAuth.user_id == current_user.id))
    
    if user_auth:
        user_auth.refresh_token = None
        await db.commit()
        
    return {"status": "success"}


# --- Password Management & Recovery ---

async def set_initial_password(payload_data: dict, db: AsyncSession):
    """Processes the mandatory password update required upon first login."""
    user = await db.scalar(select(User).options(
        joinedload(User.auth)
    ).filter(User.id == payload_data["user_id"]))

    if not user:
        return {"status": "invalid_user"}

    user.auth.password_hash = hash_password(payload_data["new_password"])
    user.auth.required_password_change = False

    access_token = create_access_token(data={"user_id": str(user.id)})
    refresh_token = create_refresh_token(data={"user_id": str(user.id)})

    user.auth.refresh_token = refresh_token
    await db.commit()

    return {
        "status": "success",
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer"
    }


async def request_password_reset(email: str, db: AsyncSession):
    """Generates a secure 6-digit recovery code and dispatches it via email."""
    user = await db.scalar(select(User).options(joinedload(User.auth)).filter(User.email == email))

    # Always return success to prevent email enumeration attacks
    if not user:
        return {"status": "success"}

    reset_code = f"{secrets.randbelow(1000000):06d}"
    user.auth.reset_token = reset_code
    user.auth.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    send_email_code(target_email=user.email, code=reset_code)
    return {"status": "success"}


async def confirm_password_reset(payload_data: dict, db: AsyncSession):
    """Validates a recovery code and applies a new cryptographic password hash."""
    user = await db.scalar(select(User).options(joinedload(User.auth)).filter(User.email == payload_data["email"]))
    
    if not user:
        return {"status": "invalid_request"}

    now = datetime.now(timezone.utc)
    
    if (not user.auth.reset_token or 
        user.auth.reset_token != payload_data["code"] or 
        not user.auth.reset_token_expires or 
        now > user.auth.reset_token_expires.replace(tzinfo=timezone.utc)):
        return {"status": "invalid_code"}

    user.auth.password_hash = hash_password(payload_data["new_password"])
    user.auth.reset_token = None
    user.auth.reset_token_expires = None
    user.auth.failed_login_attempts = 0
    user.auth.locked_until = None
    await db.commit()

    return {"status": "success"}