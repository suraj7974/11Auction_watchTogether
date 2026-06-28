# Watch Together Platform

A watch-party platform where one user creates a room, adds a YouTube link, invites friends, and
everyone watches **in sync** — with realtime play/pause/seek, live chat, presence, reactions, a
shared watch queue, and a synchronized start countdown.

> Built for the **11auction** assignment — Option 4: Watch Together Platform.

---

## Live Demo

_TBD — hosted Vercel URL will go here._

## Demo Credentials

_TBD — seeded demo account email/password + public demo room link._

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Backend / DB / Auth:** Supabase (Postgres, Auth, Realtime)
- **Realtime:** Supabase Realtime — broadcast (playback/reactions/countdown), presence
  (participants), postgres_changes (persisted chat)
- **Video:** YouTube IFrame Player API
- **Hosting:** Vercel

## Features

**Core**
- Create watch room · Join by link/code · Add YouTube URL · Shared player
- Realtime play/pause/seek sync · Realtime chat · Participants list
- Late-joiner sync · Room persistence

**Extras**
- Host-only controls · Emoji reactions · Watch queue · Start-at-same-time countdown

## Architecture

_TBD — see `docs/PROJECT_DOCUMENTATION.md`._

## Realtime Design

_TBD — host-authoritative sync model, drift correction, late-joiner sync._

## Database Schema

_TBD — `profiles`, `rooms`, `queue_items`, `messages`, `room_participants`._

## AI Usage

This project was built with **Claude Code**. See `ai-transcripts/` for session exports and
`ai-transcripts/ai-usage-summary.md` for a summary of what AI helped with and the manual
decisions made.

## Running Locally

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase keys
pnpm dev
```

App runs at http://localhost:3000.

## Environment Variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Known Limitations

_TBD._

## Future Improvements

_TBD._

## Assumptions

- YouTube is the primary video source (IFrame API enables precise sync).
- Desktop-first (per the assignment, responsiveness is not graded).
- Host-authoritative playback sync.
