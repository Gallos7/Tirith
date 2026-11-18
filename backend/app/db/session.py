"""
Database connection and session management.
Initializes the SQLAlchemy engine and provides the dependency for FastAPI route injection.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

# Initialize the core database engine.
# pool_pre_ping=True ensures dropped cloud database connections are automatically recycled.
engine = create_async_engine(
    settings.PALANTIR_URI,
    pool_pre_ping=True
)

# Configure the session factory.
# Strict manual transaction management is enforced via autocommit=False.
AsyncSessionLocal = async_sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit = False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session for a single HTTP request context.
    
    Implements a generator pattern to ensure the database session is safely 
    and automatically closed after the request lifecycle completes, preventing connection leaks.
    
    Yields:
        Session: An active SQLAlchemy database session.
    """
    async with AsyncSessionLocal() as db:
        yield db