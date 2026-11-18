import re
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Core properties defining a standard Watcher (User) profile within the system."""
    email: EmailStr


class UserCreate(UserBase):
    """
    Schema utilized for registering a new watcher. 
    Enforces strict password complexity policies prior to database insertion.
    """
    password: str = Field(..., min_length=8, max_length=72)

    @classmethod
    @field_validator('password')
    def validate_password_complexity(cls, value: str) -> str:
        """
        Cryptographic policy validator.
        Requires at least one uppercase letter, one lowercase letter, one digit, and one special character.
        """
        pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$"
        if not re.match(pattern, value):
            raise ValueError('Password must contain at least one lowercase, one uppercase, one digit, and one special character.')
        return value


class UserShow(UserBase):
    """Sanitized response schema for User data. Strictly excludes sensitive credentials."""
    id: UUID
    full_name: str
    is_active: bool
    is_super_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateProfile(BaseModel):
    """Payload schema for user self-service profile modifications."""
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None