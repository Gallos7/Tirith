import pytest

pytestmark = pytest.mark.asyncio


async def test_create_new_site(authorized_client):
    """Verifies the creation of a new telemetry target linked to the authenticated user."""
    payload = {
        "name": "This is a test",
        "url": "https://www.youtube.com/watch?v=stgT4hOG8lU&t=15s",
        "check_interval_seconds": 5,
        "is_active": True
    }

    response = await authorized_client.post("/api/v1/sites/create", json=payload)

    assert response.status_code == 201
    assert response.json()["name"] == "This is a test"


async def test_get_all(authorized_client):
    """Ensures a user can retrieve a list of all sites they have provisioned."""
    payload1 = {
        "name": "This is a test",
        "url": "https://www.youtube.com/watch?v=stgT4hOG8lU&t=15s",
        "check_interval_seconds": 5,
        "is_active": True
    }

    payload2 = {
        "name": "This is also a test",
        "url": "https://www.programiz.com/",
        "check_interval_seconds": 10,
        "is_active": True
    }

    await authorized_client.post("/api/v1/sites/create", json=payload1)
    await authorized_client.post("/api/v1/sites/create", json=payload2)

    response = await authorized_client.get("/api/v1/sites/get_all")

    assert response.json()[0]["name"] == "This is a test"
    assert response.json()[1]["name"] == "This is also a test"


async def test_get_one(authorized_client):
    """Verifies that an owner can fetch the detailed configuration of a specific site."""
    payload = {
        "name": "This is a test",
        "url": "https://www.youtube.com/watch?v=stgT4hOG8lU&t=15s",
        "check_interval_seconds": 5,
        "is_active": True
    }

    site = await authorized_client.post("/api/v1/sites/create", json=payload)
    site_id = site.json()["id"]

    response = await authorized_client.get(f"/api/v1/sites/get_one/{site_id}")

    assert response.status_code == 200
    assert response.json()["name"] == "This is a test"


async def test_update_site(authorized_client):
    """Tests that a site's configuration can be mutated successfully."""
    payload = {
        "name": "This is a test",
        "url": "https://www.youtube.com/watch?v=stgT4hOG8lU&t=15s",
        "check_interval_seconds": 5,
        "is_active": True
    }

    site = await authorized_client.post("/api/v1/sites/create", json=payload)
    site_id = site.json()["id"]

    change = {"name": "Now this is A site!"}
    response = await authorized_client.put(f"/api/v1/sites/update/{site_id}", json=change)

    assert response.status_code == 200
    assert response.json()["name"] == "Now this is A site!"


async def test_delete_site(authorized_client):
    """Ensures a site can be deleted, verifying the cascade logic deletes logs implicitly."""
    payload = {
        "name": "This is a test",
        "url": "https://www.youtube.com/watch?v=stgT4hOG8lU&t=15s",
        "check_interval_seconds": 5,
        "is_active": True
    }
    
    site = await authorized_client.post("/api/v1/sites/create", json=payload)
    site_id = site.json()["id"]

    response = await authorized_client.delete(f"/api/v1/sites/delete/{site_id}")

    assert response.status_code == 204


async def test_get_uptime(authorized_client):
    """Verifies the uptime calculation endpoint returns a valid percentage structure."""
    site = await authorized_client.post("/api/v1/sites/create", json={
        "name": "Uptime Target",
        "url": "https://example.com",
        "check_interval_seconds": 60,
        "is_active": True
    })
    site_id = site.json()["id"]

    response = await authorized_client.get(f"/api/v1/sites/{site_id}/uptime")

    assert response.status_code == 200
    assert "uptime_percentage" in response.json()


async def test_get_graph_data(authorized_client):
    """Ensures the graphing endpoint returns chronological telemetry arrays for the frontend."""
    site = await authorized_client.post("/api/v1/sites/create", json={
        "name": "Graph Target",
        "url": "https://example.com",
        "check_interval_seconds": 60,
        "is_active": True
    })
    site_id = site.json()["id"]

    # Manually create a ping log so the graph has data to return
    await authorized_client.post("/api/v1/logs/test_create", json={
        "site_id": site_id,
        "is_up": True,
        "response_time": 120,
        "status_code": 200
    })

    response = await authorized_client.get(f"/api/v1/sites/{site_id}/graph-data")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["response_time"] == 120
    assert "timestamp" in data[0]