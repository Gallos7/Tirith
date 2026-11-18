from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.routers import auth, users, sites, ping_logs

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Sentinel monitoring and uptime telemetry platform.",
)

# CORS Configuration
# Whitelists the local React dev server to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Registration
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(sites.router, prefix="/api/v1/sites", tags=["Sites"])
app.include_router(ping_logs.router, prefix="/api/v1/logs", tags=["Logs"])


@app.get("/health", tags=["System"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Verifies that the API service and underlying PostgreSQL instance are reachable.
    """
    result = await db.execute(text("SELECT 1"))
    status_flag = result.scalar() == 1

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "connected" if status_flag else "unreachable",
    }