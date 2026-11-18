import asyncio
import httpx
import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.db.session import AsyncSessionLocal
from app.models.sites import MonitoredSite
from app.models.ping_log import PingLog


async def ping_url(client: httpx.AsyncClient, url: str):
    """
    Executes a single, non-blocking HTTP GET request to the target beacon.
    Calculates precise response times in milliseconds and captures HTTP status codes.
    """
    start_time = time.perf_counter()

    try:
        response = await client.get(url, timeout=10)
        response_time = int((time.perf_counter() - start_time) * 1000)
        status_code = response.status_code
        is_up = True
        e_message = None
    except httpx.RequestError as e:
        response_time = int((time.perf_counter() - start_time) * 1000)
        status_code = None
        is_up = False
        e_message = str(e)


    return {
        "is_up": is_up,
        "status_code": status_code,
        "response_time": response_time,
        "error_message": e_message
    }


async def process_due_sites(db: AsyncSession):
    """
    Evaluates all active sites against their configured polling intervals.
    Executes pending pings concurrently using asyncio.gather for maximum throughput,
    then persists the telemetry data back to the database in a single transaction.
    """
    sites = await db.execute(select(MonitoredSite).where(MonitoredSite.is_active == True))
    sites = sites.scalars().all()

    due_sites = []
    tasks = []
    now  = datetime.now(timezone.utc)

    # Reusing a single AsyncClient connection pool for optimal performance
    async with httpx.AsyncClient() as client:
        for site in sites:
            if site.last_checked_at is None or (now - site.last_checked_at).total_seconds() >= site.check_interval_seconds:
                due_sites.append(site)
                # We do not await here; we queue the coroutine for concurrent execution
                tasks.append(ping_url(client, site.url))

        # Execute all pending network requests concurrently
        results = await asyncio.gather(*tasks)
        
        for site, ping_result in zip(due_sites, results):
            new_log = PingLog(
                site_id=site.id,
                status_code=ping_result["status_code"],
                response_time=ping_result["response_time"],
                is_up=ping_result["is_up"],
                error_message=ping_result["error_message"]
            )
            
            db.add(new_log)
            
            # Update the parent site's caching metrics
            site.last_checked_at = datetime.now(timezone.utc)
            site.current_status = "up" if ping_result["is_up"] else "down"
            site.last_response_time = ping_result["response_time"]
            
            print(f"Pinging {site.url} - Status: {site.current_status} - Duration: {ping_result['response_time']}ms")

    # Commit the entire batch of telemetry updates simultaneously
    await db.commit()


async def main():
    """
    The infinite event loop driving the background worker.
    Spawns short-lived database sessions to prevent connection starvation.
    """
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await process_due_sites(db)
        except Exception as e:
            print(f"Worker Exception: {e}")
            
        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())