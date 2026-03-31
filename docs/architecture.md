# FlowCast Architecture

## System Overview
See README.md for full stack details.

## Data Flow
1. N8N Trend Scanner → Supabase (opportunities table)
2. Dashboard reads opportunities → User approves
3. N8N Script Factory → generates scripts per channel
4. N8N Media Builder → voice + video assembly
5. N8N Publisher → YouTube / Instagram / TikTok
6. N8N Analytics Sync → Supabase (analytics table)
7. Dashboard reads analytics → displays to user

## Database Schema (Supabase)

### channels
- id, name, niche, status, platform_ids, prompt, created_at

### opportunities  
- id, name, niche, score, trend_pct, competition, cpm_range, why, status, created_at

### videos
- id, channel_id, title, script, status, platform_urls, views, created_at

### analytics
- id, channel_id, date, views, subs, revenue, avg_watch_time
