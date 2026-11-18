from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory
import pytest_asyncio, pytest

from httpx import AsyncClient, ASGITransport
from sqlalchemy import StaticPool, update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User

# --- Test Environment Configuration ---
# Forces SQLite to operate entirely in RAM for blazing fast, isolated test execution
DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Database Lifecycle Fixtures ---

@pytest.fixture(autouse=True)
async def setup_db():
    """Automatically provisions and tears down the database schema for every test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    

@pytest.fixture
async def db_session():
    """Yields a dedicated async database session for a single test."""
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session):
    """Overrides the FastAPI dependency injection to force the app to use the test database."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class UserFactory(SQLAlchemyFactory[User]):
    __model__ = User
    __set_relationships__ = True


# --- Specialized Client Fixtures ---

@pytest.fixture
async def authorized_client(client):
    """
    A specialized test client that automatically provisions a standard user, 
    logs them in, and attaches the JWT authorization header to every subsequent request.
    """
    await client.post("/api/v1/users/register", json={
        "email": "profile_tester@example.com",
        "password": "ValidPassword1!"
    })

    login_response = await client.post("/api/v1/auth/login", data={
        "username": "profile_tester@example.com",
        "password": "ValidPassword1!"
    })

    token = login_response.json()["access_token"]

    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {token}"
    }

    return client


@pytest.fixture
async def admin_client(client, db_session):
    """
    A specialized test client that provisions an administrative user,
    bypassing the standard registration flow to force the `is_super_admin` flag to True.
    """
    await client.post("/api/v1/users/register", json={
        "email": "admin_tester@example.com",
        "password": "ValidPassword1!"
    })

    await db_session.execute(
        update(User)
        .where(User.email == "admin_tester@example.com")
        .values(is_super_admin=True)
    )
    await db_session.commit()

    login_response = await client.post("/api/v1/auth/login", data={
        "username": "admin_tester@example.com",
        "password": "ValidPassword1!"
    })

    token = login_response.json()["access_token"]

    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {token}"
    }

    return client


@pytest.fixture
async def create_site(authorized_client):
    """Utility fixture that provisions a dummy monitored site before a test executes."""
    response = await authorized_client.post("/api/v1/sites/create", json={
        "name": "Telemetry Test Site",
        "url": "https://example.com",
        "check_interval_seconds": 60,
        "is_active": True
    })

    yield response.json()