# FlowCast 🎬

> Autonomous multi-platform content engine. Discovers trending niches, generates videos with AI, and publishes to YouTube, Instagram, and TikTok — fully on autopilot.

---

## What It Does

1. **Discovers** — Scans Google Trends, Reddit, and YouTube daily for emerging niches
2. **Suggests** — AI scores each opportunity (competition, CPM, growth rate) and presents channel ideas
3. **Launches** — One tap creates the channel and queues the first batch of AI-generated videos
4. **Publishes** — Auto-posts to YouTube, Instagram Reels, and TikTok on a schedule
5. **Optimizes** — Tracks analytics, pauses underperformers, scales winners

---

## Tech Stack

| Layer | Technology |
|---|---|
| Dashboard | React + Vite |
| Backend API | Node.js + Express |
| Automation | N8N (self-hosted) |
| Database | Supabase (PostgreSQL) |
| AI Scripts | Claude API (Anthropic) |
| Voiceover | ElevenLabs API |
| Video Build | FFmpeg + Remotion |
| Stock Footage | Pexels API |
| Publishing | YouTube Data API v3, Meta Graph API, TikTok API |
| Analytics | YouTube Analytics API |

---

## Project Structure

```
FlowCast/
├── apps/
│   ├── dashboard/          # React admin UI
│   │   └── src/
│   │       ├── pages/      # Main views (Dashboard, Channels, Queue, Analytics)
│   │       ├── components/ # Reusable UI components
│   │       ├── hooks/      # Custom React hooks
│   │       └── lib/        # API clients, utilities
│   └── api/                # Node.js backend
│       └── src/
│           ├── routes/     # REST API endpoints
│           ├── services/   # Business logic (AI, video, upload)
│           └── jobs/       # Scheduled cron jobs
├── n8n/
│   ├── workflows/          # Exported N8N workflow JSON files
│   └── templates/          # Reusable N8N node templates
├── docs/                   # Architecture docs, API references
├── scripts/                # Setup, deployment, utility scripts
└── README.md
```

---

## N8N Workflows

| Workflow | Schedule | Description |
|---|---|---|
| `trend-scanner` | Daily 6AM | Scrapes Google Trends + Reddit for hot topics |
| `channel-suggester` | Daily 7AM | Claude scores trends, generates channel briefs |
| `script-factory` | Per channel/day | Generates video scripts per channel prompt |
| `media-builder` | After script | Voice + footage + captions → final video |
| `publisher` | Scheduled | Uploads to YouTube / Instagram / TikTok |
| `analytics-sync` | Every 6hrs | Pulls performance data back to dashboard |
| `health-monitor` | Continuous | Auto-pauses channels below threshold |

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-org/flowcast.git
cd flowcast

# Install dashboard
cd apps/dashboard && npm install

# Install API
cd ../api && npm install
```

### 2. Environment Variables
```bash
# apps/api/.env
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
PEXELS_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
META_ACCESS_TOKEN=
TIKTOK_ACCESS_TOKEN=
SUPABASE_URL=
SUPABASE_KEY=
```

### 3. Run Dev
```bash
# Dashboard (localhost:5173)
cd apps/dashboard && npm run dev

# API (localhost:3000)
cd apps/api && npm run dev
```

### 4. N8N Setup
```bash
# Self-host N8N
npx n8n
# Import workflows from /n8n/workflows/
```

---

## Monetization Timeline

| Month | Milestone |
|---|---|
| 1–2 | Channels live, posting daily |
| 2–3 | First channels hit 500+ subs |
| 3–6 | First channels monetized (1K subs / 4K hrs) |
| 6–12 | 10–20 channels, $500–3K/month passive |

---

## Roadmap

- [x] Admin dashboard UI
- [ ] Supabase schema + API
- [ ] N8N trend scanner workflow
- [ ] Script generation pipeline
- [ ] Video build pipeline (FFmpeg)
- [ ] YouTube upload integration
- [ ] Instagram + TikTok upload
- [ ] Analytics sync
- [ ] Health monitor + auto-pause
- [ ] Multi-user support

---

## License

Private — Internal use only.
