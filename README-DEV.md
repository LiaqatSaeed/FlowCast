# FlowCast — Local Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| FFmpeg | any | `brew install ffmpeg` / `apt install ffmpeg` |
| npm | 9+ | Bundled with Node.js |

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd FlowCast

# Install root + both app dependencies
npm run install:all
```

---

## 2. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Copy your **Project URL** and **Service Role Key** from *Settings → API*
3. Copy your **Anon/Public Key** from the same page
4. In the Supabase **SQL Editor**, run the migration file:

```sql
-- Paste contents of:
apps/api/src/db/migrations/001_initial_schema.sql
```

5. Confirm all 4 tables exist: `opportunities`, `channels`, `videos`, `analytics`

---

## 3. Configure Environment Variables

**API** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
```
Fill in:
- `SUPABASE_URL` — from Supabase project settings
- `SUPABASE_SERVICE_KEY` — Service Role key (keep secret)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `ELEVENLABS_API_KEY` — from [elevenlabs.io](https://elevenlabs.io)
- `ELEVENLABS_VOICE_ID` — copy a voice ID from ElevenLabs voices tab
- `PEXELS_API_KEY` — from [pexels.com/api](https://www.pexels.com/api/)

Publishing (optional — required for auto-posting):
- `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REDIRECT_URI`
- `META_ACCESS_TOKEN` (Instagram)
- `TIKTOK_ACCESS_TOKEN`

**Dashboard** (`apps/dashboard/.env`):
```bash
cp apps/dashboard/.env.example apps/dashboard/.env
```
Fill in:
- `VITE_SUPABASE_URL` — same as API's SUPABASE_URL
- `VITE_SUPABASE_ANON_KEY` — Anon/Public key from Supabase
- `VITE_API_URL` — `http://localhost:3000` (default)

---

## 4. Run the Setup Checker

```bash
npm run setup
```

This verifies all env vars, FFmpeg installation, and service connections.

---

## 5. Start Development

```bash
npm run dev
```

This starts both servers concurrently:
- **API**: `http://localhost:3000`
- **Dashboard**: `http://localhost:5173`

---

## 6. Open the Dashboard

Visit [http://localhost:5173](http://localhost:5173)

Log in with the Supabase user you created in step 2.
To create an admin user: go to Supabase → **Authentication → Users → Invite User**.

---

## 7. N8N Automation Setup

```bash
# Start N8N locally
npx n8n

# Visit N8N at http://localhost:5678
```

Import workflows from `n8n/workflows/`:
1. Click **Workflows → Import from File**
2. Import each `.json` file in order:
   - `trend-scanner.json`
   - `script-factory.json`
   - `media-builder.json`
   - `publisher.json`
   - `analytics-sync.json`
   - `health-monitor.json`
3. Configure credentials in each workflow (Supabase, HTTP Auth headers)
4. Activate the workflows

---

## Project Structure

```
FlowCast/
├── apps/
│   ├── api/                 Node.js + Express backend
│   │   └── src/
│   │       ├── index.js     Entry point (CORS, logger, routes)
│   │       ├── lib/         supabase.js, logger.js
│   │       ├── middleware/  auth.js (JWT verification)
│   │       ├── routes/      opportunities, channels, queue, analytics
│   │       ├── services/    claude, elevenlabs, pexels, videoBuilder
│   │       └── db/
│   │           └── migrations/001_initial_schema.sql
│   └── dashboard/           React + Vite frontend
│       └── src/
│           ├── main.jsx     Providers (React Query, Auth)
│           ├── pages/       Dashboard.jsx
│           └── lib/         supabase.js, api.js, auth.js
├── n8n/workflows/           N8N automation JSON files
├── scripts/setup.js         Setup checker
└── README-DEV.md            This file
```

---

## API Reference

All responses follow the envelope: `{ success: bool, data: any, error: string|null }`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/opportunities` | List all opportunities |
| PATCH | `/api/opportunities/:id` | Approve or skip |
| POST | `/api/opportunities/scan` | Trigger Claude trend scan |
| GET | `/api/channels` | List all channels |
| POST | `/api/channels` | Create channel from opportunity |
| PATCH | `/api/channels/:id` | Update settings / pause / resume |
| GET | `/api/queue` | All queued videos |
| POST | `/api/queue/generate` | Generate script for channel |
| GET | `/api/analytics` | Aggregate analytics (30d) |
| GET | `/api/analytics/:channelId` | Per-channel analytics |
