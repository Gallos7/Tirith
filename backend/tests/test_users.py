import pytest

pytestmark = pytest.mark.asyncio

async def test_get_profile(authorized_client):
    """Ensures the authenticated user can successfully retrieve their own profile data."""
    response = await authorized_client.get("/api/v1/users/profile")

    assert response.status_code == 200
    assert response.json()["email"] == "profile_tester@example.com"
    assert "id" in response.json()


async def test_update_profile(authorized_client):
    """Verifies that self-service profile updates correctly mutate the database record."""
    payload = {
        "first_name": "Jimmy",
        "last_name": "Brooks"
    }

    response = await authorized_client.put("/api/v1/users/profile", json=payload)

    assert response.status_code == 200
    assert response.json()["full_name"] == "Jimmy Brooks"


async def test_get_all_users_no_admin(authorized_client):
    """RBAC validation: Standard users must be strictly blocked from viewing the global directory."""
    response = await authorized_client.get("/api/v1/users/admin/get_users")

    assert response.status_code == 401


async def test_get_all_users_admin(admin_client, client):
    """RBAC validation: Super Admins must be permitted to view the global directory."""
    await client.post("/api/v1/users/register", json={
        "email": "extra_user@example.com",
        "password": "ValidPassword1!"
    })
        
    response = await admin_client.get("/api/v1/users/admin/get_users")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 2

    assert data[0]["email"] == "admin_tester@example.com"
    assert "id" in data[0]

    assert data[1]["email"] == "extra_user@example.com"
    assert data[1]["is_super_admin"] is False


async def test_delete_my_account(authorized_client):
    """Verifies that a user can successfully soft-delete their own profile."""
    # Delete the account
    response = await authorized_client.delete("/api/v1/users/profile")
    assert response.status_code == 204

    # Verify the account is actually deactivated by attempting to fetch the profile
    # The get_current_user dependency should throw a 403 because is_active is now False
    verify_response = await authorized_client.get("/api/v1/users/profile")
    assert verify_response.status_code == 403
    assert verify_response.json()["detail"] == "Inactive or deleted user account."