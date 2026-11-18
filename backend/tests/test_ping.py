import pytest

pytestmark = pytest.mark.asyncio

async def test_create_ping_log(authorized_client, create_site):
    """
    Simulates a worker ping and ensures the telemetry log is correctly associated 
    with the parent site in the database.
    """
    site_id = create_site["id"]

    payload = {
        "site_id": site_id,
        "is_up": True
    }

    create_log = await authorized_client.post("/api/v1/logs/test_create", json=payload)

    assert create_log.status_code == 200

    get_log = await authorized_client.get(f"/api/v1/logs/get_one/{site_id}/logs")

    assert get_log.json()[0]["id"] == create_log.json()["id"]