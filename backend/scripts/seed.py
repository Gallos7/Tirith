import asyncio
from app.db.session import AsyncSessionLocal 
from app.models.user import User
from app.models.user_auth import UserAuth
from app.models.sites import MonitoredSite 
from app.core.security import hash_password 

async def seed_db():
    async with AsyncSessionLocal() as session:
        print("🌱 Starting database seed...")

        # 1. Create 4 Dummy Users (matching your User model)
        users = [
            User(email="dev@tirith.com", full_name="Developer"),
            User(email="ops@tirith.com", full_name="Operations"),
            User(email="client@tirith.com", full_name="Client"),
            User(email="test@tirith.com", full_name="Tester")
        ]
        session.add_all(users)
        await session.flush() 

        # 2. Create the Auth records linked to those Users (matching your UserAuth model)
        auth_records = [
            UserAuth(user_id=users[0].id, password_hash=hash_password("DevPassword123!")), 
            UserAuth(user_id=users[1].id, password_hash=hash_password("OpsPassword123!")),
            UserAuth(user_id=users[2].id, password_hash=hash_password("ClientPass123!")),
            UserAuth(user_id=users[3].id, password_hash=hash_password("TestPass123!"))
        ]
        session.add_all(auth_records)
        await session.flush()

        # 3. Create 16 Real Sites (matching your MonitoredSite model)
        sites = [
            # User 1: Tech & Dev
            MonitoredSite(user_id=users[0].id, name="GitHub", url="https://github.com", is_active=True, check_interval_seconds=60),
            MonitoredSite(user_id=users[0].id, name="StackOverflow", url="https://stackoverflow.com", is_active=True, check_interval_seconds=60),
            MonitoredSite(user_id=users[0].id, name="Dev.to", url="https://dev.to", is_active=True, check_interval_seconds=60),
            MonitoredSite(user_id=users[0].id, name="HackerNews", url="https://news.ycombinator.com", is_active=True, check_interval_seconds=60),

            # User 2: Media
            MonitoredSite(user_id=users[1].id, name="Netflix", url="https://www.netflix.com", is_active=True, check_interval_seconds=120),
            MonitoredSite(user_id=users[1].id, name="Spotify", url="https://www.spotify.com", is_active=True, check_interval_seconds=120),
            MonitoredSite(user_id=users[1].id, name="Wikipedia", url="https://www.wikipedia.org", is_active=True, check_interval_seconds=120),
            MonitoredSite(user_id=users[1].id, name="IMDb", url="https://www.imdb.com", is_active=True, check_interval_seconds=120),

            # User 3: Cloud Infrastructure
            MonitoredSite(user_id=users[2].id, name="Cloudflare", url="https://www.cloudflare.com", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[2].id, name="AWS", url="https://aws.amazon.com", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[2].id, name="DigitalOcean", url="https://www.digitalocean.com", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[2].id, name="Heroku", url="https://www.heroku.com", is_active=True, check_interval_seconds=30),

            # User 4: Fast/Dead Testing Sites (Crucial for testing the worker later)
            MonitoredSite(user_id=users[3].id, name="Google (Fast)", url="https://www.google.com", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[3].id, name="HTTPStat (Simulated Slow)", url="https://httpstat.us/200?sleep=2000", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[3].id, name="Dead Site (Error)", url="https://this-website-does-not-exist-tirith.com", is_active=True, check_interval_seconds=30),
            MonitoredSite(user_id=users[3].id, name="JSONPlaceholder", url="https://jsonplaceholder.typicode.com/posts/1", is_active=True, check_interval_seconds=30),
        ]

        session.add_all(sites)
        await session.commit()
        print("✅ Successfully seeded 4 users and 16 real websites!")

if __name__ == "__main__":
    asyncio.run(seed_db())