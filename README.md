# Project Tirith  𖣂

> *“The beacons are lit!”* — A high-performance, asynchronous uptime monitoring and telemetry platform. Named after *Minas Tirith* (Sindarin for *“Tower of Guard”*)

**Project Tirith** is a full-stack site-monitoring platform built for reliability, concurrency, and clean design. It pairs an asynchronous **FastAPI + `asyncpg`** backend and background polling worker with a feature-driven **React + Tailwind** frontend—wrapping real-time HTTP health checks, latency telemetry, and downtime alerting in a subtle, dark-mode *Lord of the Rings* aesthetic.

---

## 🎬 Demo Preview

https://github.com/user-attachments/assets/39c65238-ff9e-4a53-9aba-de1453bca588

---

## ✨ Key Features

- **⚡ Asynchronous Polling Engine**  
  A dedicated background worker utilizing `asyncio.gather` and `httpx` to ping dozens of monitored sites concurrently without blocking the main API thread.

- **🧩 Feature-Driven Frontend**  
  A highly scalable React architecture where logic, state, and UI are grouped by domain (e.g., `features/beacons/`, `features/auth/`) rather than by file type.

- **🔐 Robust Security & Auth**  
  JWT-based authentication with automated, interceptor-driven silent token refreshing. Includes a secure password reset flow powered by the Resend API.

- **📈 Telemetry & Observability**  
  Real-time response time tracking, latency calculations, and historical uptime tracking visualized through interactive Recharts.

- **🕯️ Cohesive Dark-Mode UX ("Watchtower" Theme)**  
  Purpose-built dark interface using subtle *Lord of the Rings* motifs—monitored endpoints are tracked as **Beacons**, live telemetry views consult the **Palantír**, and the authentication gate welcomes returning operators with *"Speak, friend, and enter."*

- **🐳 Fully Containerized**  
  Clean, reproducible environments orchestrated via Docker Compose with explicit container networking and unified `.env` configurations.

---

## 🏗️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.12)
- **Database:** PostgreSQL 15 
- **Drivers & ORM:** `asyncpg` for asynchronous database connections, SQLAlchemy 2.0 (Async)
- **Migrations:** Alembic
- **Concurrency:** `asyncio` background worker
- **Email Service:** Resend API

### Frontend
- **Framework:** React 19 + Vite
- **Architecture:** Feature-Driven Design
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **HTTP Client:** Axios (Custom `apiClient` with interceptors)
- **Data Visualization:** Recharts

### DevOps
- **Containerization:** Docker & Docker Compose

---

## 📂 Project Structure

Project Tirith utilizes a clean monorepo architecture, containerized for immediate deployment:

```text
Tirith/
|
├── docker-compose.yml    # Master orchestration file (API, Worker, DB, UI)
|
├── backend/              # FastAPI backend
│   ├── Dockerfile        # Backend container blueprint
│   ├── requirements.txt  # Python dependencies
│   ├── .env.example      # Environment variables template
│   ├── worker.py         # ⚡ Asynchronous background polling engine
│   ├── alembic/          # Database migrations
│   ├── scripts/     
│       ├── nuke/         # Database reset utility     
│   │   └── seed.py       # Database populator script
│   └── app/              # Core API logic
│       ├── core/         # Security and configuration
│       ├── db/           # Asyncpg session logic
│       ├── models/       # SQLAlchemy tables
│       ├── routers/      # API endpoints
│       └── services/     # Business logic
|
└── frontend/             # React (Vite) frontend
    ├── Dockerfile        # Frontend container blueprint
    ├── package.json      # Node dependencies
    ├── src/              
    │   ├── components/   # Global reusable UI (Layouts, Inputs)
    │   ├── context/      # Global state (AuthContext)
    │   ├── features/     # 🧩 Feature-Driven domain logic (beacons, auth, users)
    │   ├── pages/        # Route assembly
    │   └── services/     # apiClient.js (JWT Interceptors)
```

---

## 🚀 Getting Started

Tirith is fully containerized. You do not need to install Python, Node.js, or PostgreSQL on your local machine.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

---

### 1️⃣ Environment Setup

Clone the repository and set up your backend environment variables:

```bash
git clone "https://github.com/YourUsername/Project-Tirith.git"
cd Tirith/backend
cp .env.example .env
```

*Note: Ensure your `DATABASE_URL` in the `.env` file points to the Docker database service:*
`DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/tirith`

---

### 2️⃣ Light the Beacons

Return to the root project folder and start the entire stack:

```bash
cd ..
docker compose up --build
```

- **Frontend UI**: `http://localhost:5173`
- **Backend Swagger API**: `http://localhost:8000/docs`

---

## 🛠️ Developer Tools

To interact with the database inside the Docker container, open a new terminal in the root directory while the containers are running.

### 🌱 Apply Migrations & Seed the Database

Before logging in, you must generate the PostgreSQL schema and seed the initial data:

```bash
# 1. Build the database tables using Alembic
docker exec -it tirith-api alembic upgrade head

# 2. Seed the initial data using the module flag
docker exec -it tirith-api python -m scripts.seed
```

**Test Credentials:**
Once seeded, navigate to `http://localhost:5173/login` and authenticate using the credentials defined in your `seed.py` configuration.

---
---

<div align="center">
  <p><i>Developed by Parissis Dimitris</i></p>
</div>
