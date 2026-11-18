from pydantic import BaseModel

class Token(BaseModel):
    """Standardized OAuth2 response payload returned upon successful login."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Internal schema for validating decoded JWT claims."""
    user_id: str | None = None
    type: str | None = None