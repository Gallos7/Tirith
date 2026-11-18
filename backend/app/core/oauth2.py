from datetime import datetime, timedelta, timezone
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

# Cryptographic Constants
SECRET_KEY = settings.RING_OF_POWER_SECRET
ALGORITHM = settings.ALGORITHM
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS
ACCESS_TOKEN_EXPIRE_MINUTES = settings.WATCH_SHIFT_MINUTES

# Defines the Swagger UI authentication hook
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# --- Token Issuance ---

def create_access_token(data: dict) -> str:
    """
    Generates a short-lived JSON Web Token (JWT) for standard API authentication.
    Explicitly types the token to prevent substitution attacks.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Generates a long-lived JSON Web Token (JWT) strictly used for session renewal.
    Strict typing ensures this token cannot be utilized as an access token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# --- Token Validation & Dependency Injection ---

def verify_refresh_token(token: str) -> str | None:
    """
    Decodes and validates a refresh token to ensure session continuity.
    Returns the user_id if valid, or None if validation fails.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        token_type = payload.get("type")

        if user_id is None or token_type != "refresh":
            return None
        return str(user_id)
    except JWTError:
        return None


def verify_token(token: str, credentials_exception: HTTPException) ->  str:
    """Decodes and validates a standard access token for guarded API routes."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        token_type = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception
        return str(user_id)
    except JWTError:
        raise credentials_exception


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
    FastAPI dependency that extracts, validates, and retrieves the authenticated user entity.
    Enforces active-status checks to prevent unauthorized access by disabled accounts.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id_str = verify_token(token, credentials_exception)

    try:
        parsed_user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == parsed_user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception

    # Soft-delete security constraint
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive or deleted user account."
        )
        
    return user