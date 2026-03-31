# FlowCast — Local Development Setup

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

> FFmpeg is **not required locally** — it runs inside the API Docker container.

---

## 1. Clone & Install

```bash
git clone https://github.com/LiaqatSaeed/FlowCast.git
cd FlowCast
npm install              # installs root dev tools
npm run install:all      # installs dashboard + api dependencies
```

---

## 2. Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

Then open `apps/api/.env` and fill in:

| Variable | Where to get it |
|---|---|
| `JWT_SECRET` | Run: `openssl rand -base64 64` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) |
| `PEXELS_API_KEY` | [pexels.com/api](https://www.pexels.com/api) |
| `DATABASE_URL` | Already pre-filled for Docker |

---

## 3. Start the Database

```bash
docker compose up -d postgres
```

This starts PostgreSQL and **automatically runs all migration files** in `apps/api/src/db/migrations/` on first boot.

Verify it's running:
```bash
docker compose ps
```

Default admin login created by seed migration:
- Email: `admin@flowcast.ai`
- Password: `admin123`

---

## 4. Run the App

### Option A — Docker (everything containerized)
```bash
docker compose up
```
Visit:
- Dashboard: http://localhost:5173
- API: http://localhost:3000
- pgAdmin: http://localhost:5050 (admin@flowcast.ai / admin123)

### Option B — Local (faster for development)
```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Dashboard
cd apps/dashboard && npm run dev
```

### Option C — Root shortcut
```bash
npm run dev
```

---

## 5. Verify Setup

```bash
node scripts/setup.js
```

This checks all env vars and tests the database connection.

---

## 6. Database Management

```bash
# Open pgAdmin GUI
open http://localhost:5050

# Or use psql directly
docker exec -it flowcast_db psql -U flowcast -d flowcast

# Run migrations manually
cd apps/api && npm run migrate

# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d postgres
```

---

## 7. Project Structure

```
FlowCast/
├── docker-compose.yml          ← All services (DB, API, Dashboard, pgAdmin)
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── src/
│   │       ├── lib/db.js        ← PostgreSQL pool (pg)
│   │       ├── middleware/auth.js ← JWT auth (jsonwebtoken)
│   │       ├── routes/          ← REST endpoints
│   │       ├── services/        ← Claude, ElevenLabs, FFmpeg etc.
│   │       └── db/
│   │           ├── migrate.js   ← Migration runner
│   │           └── migrations/
│   │               ├── 001_initial_schema.sql
│   │               └── 002_seed_admin.sql
│   └── dashboard/
│       ├── .env.example
│       └── src/
├── n8n/workflows/
└── scripts/setup.js
```

---

## 8. N8N Automation

```bash
# Start N8N locally
npx n8n

# Open N8N editor
open http://localhost:5678

# Import all workflows
# Settings → Import from file → select each file in n8n/workflows/
```

---

## Common Issues

**Port 5432 already in use?**
```bash
lsof -i :5432   # find the process
kill -9 <PID>   # kill it
```

**Docker containers not starting?**
```bash
docker compose logs postgres
docker compose logs api
```

**Database schema not applied?**
```bash
cd apps/api && npm run migrate
```
