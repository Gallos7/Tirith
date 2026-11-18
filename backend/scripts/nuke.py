"""
Database Teardown Utility.
Completely wipes the database schema, dropping all tables and resetting 
the Alembic migration history for the Tirith monitoring environment.
"""
import asyncio
from sqlalchemy import text

# Import your async engine and Base
from app.db.session import engine
from app.db.base import Base

# Import all models to ensure they are registered with Base.metadata before dropping
from app.models.user import User
from app.models.user_auth import UserAuth
from app.models.sites import MonitoredSite
# If you have a PingLog model, import it here too:
# from app.models.pings import PingLog 

async def nuke():
    print("🧨 WARNING: Initiating total database teardown...")
    confirmation = input("Type 'NUKE' to confirm destruction of all data: ")
    
    if confirmation != 'NUKE':
        print("Teardown aborted. Your data is safe.")
        return

    async with engine.begin() as conn:
        # 1. Drop all tables associated with SQLAlchemy models
        await conn.run_sync(Base.metadata.drop_all)
        
        # 2. Drop the alembic_version table to reset migration tracking
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        
    print("✅ Database wiped successfully! All tables and Alembic history removed.")

if __name__ == "__main__":
    # Because Tirith is async, we must run this via asyncio
    asyncio.run(nuke())