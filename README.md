# new_buffer

A Buffer-style social media scheduler. Schedule text/media posts to **Bluesky** (working),
with **Meta** and **TikTok** planned. Built to run for ~$0/month on free tiers.

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Prisma** + **Supabase Postgres** — data
- **Vercel Cron** — a route runs every minute and publishes due posts (no Redis needed)
- **Tailwind CSS** — UI
- **@atproto/api** — Bluesky posting

## How scheduling works

1. `POST /api/schedule` creates a `ScheduledPost` (status `SCHEDULED`).
2. Vercel Cron hits `GET /api/cron` every minute (`vercel.json`).
3. `processDuePosts()` finds posts with `scheduledFor <= now` and publishes each via
   the platform modules in `src/lib/platforms/`, writing a `PostHistory` row per platform.
4. Failed posts retry (up to 3×) with the error captured in `errorLog`.

## Setup

```bash
npm install
cp .env.example .env    # fill in Supabase DATABASE_URL / DIRECT_URL
npm run db:generate
npm run db:push         # creates tables in Supabase
npm run dev
```

Open http://localhost:3000.

### Try Bluesky immediately

Create an **App Password** at Bluesky → Settings → App Passwords (not your login password), then:

```bash
curl -X POST http://localhost:3000/api/platforms/bluesky/post \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"you.bsky.social","appPassword":"xxxx-xxxx-xxxx-xxxx","text":"Hello from new_buffer!"}'
```

### Testing the cron locally

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron
```

## Roadmap

- [x] Phase 1 — scaffold, schema, cron scheduler
- [x] Bluesky end-to-end (connect + post + scheduled publish)
- [ ] Auth (NextAuth / Supabase Auth) — currently a single `demo-user`
- [ ] Media upload pipeline (Supabase Storage)
- [ ] Meta (Instagram/Facebook) OAuth + Graph API
- [ ] TikTok OAuth + chunked upload
- [ ] Calendar dashboard + connected-accounts UI

## Notes / TODO before production

- App passwords / tokens are stored in plaintext in `SocialAccount`. Encrypt at rest.
- Replace `demo-user` with real authentication.
