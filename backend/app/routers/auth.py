from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import TokenRefreshRequest, SetInitialPasswordRequest, ForgotPasswordRequest, ResetPasswordConfirm
from app.schemas.token import Token
from app.services import auth_services
from app.core.oauth2 import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """Authenticates credentials and provisions short and long-lived JWTs."""
    result = await auth_services.login(
        email=form_data.username,
        password=form_data.password,
        db=db
    )

    if result["status"] == "invalid_credentials":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")
    
    if result["status"] == "deactivated":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        
    if result["status"] == "locked":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account locked. Contact IT.")

    if result["status"] == "requires_password_change":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Password change required upon first login."
        )

    return result


@router.post("/refresh")
async def refresh_session(request: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchanges a valid refresh token for a new access token."""
    result = await auth_services.refresh_access_token(request.refresh_token, db)
    
    if result["status"] in ["invalid_token", "revoked"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if result["status"] == "deactivated":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
        
    return {"access_token": result["access_token"], "token_type": result["token_type"]}


@router.post("/set-initial-password")
async def set_initial_password(request: SetInitialPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Finalizes account setup for users requiring a mandatory password change."""
    result = await auth_services.set_initial_password(request.model_dump(), db)
    if result["status"] == "invalid_user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    
    return result


@router.post("/password/forgot")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Dispatches a password recovery code to the provided email address."""
    await auth_services.request_password_reset(request.email, db)
    return {"message": "If an account is associated with that email, a reset code has been sent."}


@router.post("/password/reset")
async def confirm_reset(request: ResetPasswordConfirm, db: AsyncSession = Depends(get_db)):
    """Consumes a recovery code to assign a new cryptographic password hash."""
    result = await auth_services.confirm_password_reset(request.model_dump(), db)
    
    if result["status"] == "invalid_request":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid request.")
    if result["status"] == "invalid_code":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code is invalid or has expired.")
        
    return {"message": "Password has been reset successfully. You can now log in."}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Revokes the active session token."""
    await auth_services.logout(db, current_user)
    return None