import pytest

pytestmark = pytest.mark.asyncio


async def test_register_user_success(client):
    """Verifies that a valid registration payload provisions a new user and returns a 201 Created."""
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePassword123!"
    }
    
    response = await client.post("/api/v1/users/register", json=payload) 
    
    assert response.status_code == 201
    assert response.json()["email"] == "newuser@example.com"


async def test_duplicate_registration(client):
    """Ensures the system enforces unique email constraints and rejects duplicate signups."""
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!"
    }
    
    await client.post("/api/v1/users/register", json=payload)
    response = await client.post("/api/v1/users/register", json=payload)
    
    assert response.status_code in [400, 409] 
    assert "detail" in response.json()


async def test_login_success(client):
    """Validates the standard OAuth2 login flow, ensuring access and refresh tokens are provisioned."""
    reg_response = await client.post("/api/v1/users/register", json={
        "email": "login_test@example.com",
        "password": "ValidPassword1!"
    })
    
    assert reg_response.status_code == 201, f"Setup failed: {reg_response.json()}"

    response = await client.post("/api/v1/auth/login", data={
        "username": "login_test@example.com",
        "password": "ValidPassword1!"
    })

    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_failure_wrong_credentials(client):
    """Confirms the API properly obscures user existence by returning a generic 401 for bad logins."""
    response = await client.post("/api/v1/auth/login", data={
        "username": "ghost@example.com",
        "password": "wrongpassword"
    })

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Credentials"


async def test_refresh_session_success(client):
    """Verifies that a valid refresh token successfully provisions a new access token."""
    await client.post("/api/v1/users/register", json={
        "email": "refresh_test@example.com",
        "password": "ValidPassword1!"
    })
    
    login_response = await client.post("/api/v1/auth/login", data={
        "username": "refresh_test@example.com",
        "password": "ValidPassword1!"
    })
    
    refresh_token = login_response.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


async def test_logout(authorized_client):
    """Ensures the logout endpoint successfully revokes the active session."""
    response = await authorized_client.post("/api/v1/auth/logout")
    
    assert response.status_code == 204


async def test_forgot_password(client):
    """Verifies the password recovery endpoint accepts requests and returns a generic security message."""
    response = await client.post("/api/v1/auth/password/forgot", json={
        "email": "anyone@example.com"
    })

    assert response.status_code == 200
    assert "reset code has been sent" in response.json()["message"]