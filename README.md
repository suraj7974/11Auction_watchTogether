# 🎬 Watch Together Platform

A watch-party web app where one person creates a room, drops in a YouTube link, invites friends,
and **everyone watches in perfect sync** — play / pause / seek stay aligned across browsers, with
live chat, presence, emoji reactions, a shared queue, and a synchronized start countdown.

> Built for the **11auction** assignment — **Option 4: Watch Together Platform**.

---

## Live Demo

- **App:** _<add your Vercel URL here after deploying>_
- It is a **public demo**: use the seeded credentials below (no email confirmation needed).

## Demo Credentials

Two pre-seeded, ready-to-use accounts (open each in a **separate browser/profile** to watch
together):

| Role | Email | Password |
|------|-------|----------|
| Host | `demo@watchtogether.app` | `watchparty` |
| Friend | `friend@watchtogether.app` | `watchparty` |

There's a seeded **demo room** (code `DEMO01`) with two queued videos. From the dashboard, click
**Join demo**, or open `/room/DEMO01`. You can also click **Try the demo** on the login page to sign
in as the host in one click.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Base UI) + lucide icons |
| Auth / DB | **Supabase** — Postgres + Supabase Auth (email/password) |
| Realtime | **Supabase Realtime** — presence + broadcast |
| Video | **YouTube IFrame Player API** |
| Hosting | **Vercel** |

## Features

**Core (all implemented)**
- Create a watch room · Join by link/code · Add a YouTube URL
- Shared player with **realtime play / pause / seek sync**
- **Realtime chat** · **Participants list** · **Late-joiner sync** · Room persistence

**Extras**
- 🔒 **Host-only controls** (viewers can't desync the room)
- ❤️ **Emoji reactions** floating over the video
- 📺 **Watch queue** with auto-advance
- ⏱️ **Synchronized start countdown** (3 · 2 · 1 · Go!)
- 🟢 **Presence** + live **connection status** indicator
- 🔁 **Reconnect handling** (re-syncs on reconnect)

## Architecture

```
Browser (Next.js client)                Supabase                       Vercel
 ├─ Landing / Auth / Dashboard  ─────▶  Auth (email/password)      ◀── hosts the Next.js app
 ├─ Room
 │   ├─ YouTube IFrame player           Postgres (schema: eleven_auction)
 │   ├─ Chat · Reactions                 rooms, queue_items, messages,
 │   ├─ Participants (presence)          room_participants, profiles  (RLS)
 │   └─ Host controls / countdown
 └─ Server Components +          ─────▶  Realtime channel  room:{id}
    Server Actions + proxy.ts             • presence  → participants
                                          • broadcast → playback / chat / queue
                                                        / reactions / countdown
```

Separation of concerns:
- `src/app/` — routes, server actions, and `proxy.ts` (auth) — the **backend** edges
- `src/components/room/` — the room **frontend** (providers + panels)
- `src/lib/supabase/` — DB/auth clients (browser, server, admin)
- `src/lib/rooms/`, `src/lib/youtube*` — domain logic
- `supabase/migrations/` + `supabase/seed.ts` — **database**

See **[`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md)** for the deep dive and
**[`docs/OVERVIEW.md`](docs/OVERVIEW.md)** for a plain-language walkthrough.

## Realtime Design

**Host-authoritative** model — the host's player is the single source of truth, which is what
prevents permanent desync.

- One Supabase Realtime **channel per room** (`room:{roomId}`).
- **Playback:** the host broadcasts `{ videoId, positionSeconds, isPlaying, emittedAt }` on
  play/pause/seek/track-change. Viewers apply it, accounting for elapsed time.
- **Drift correction:** the host emits a heartbeat every 2.5s; any viewer more than ~1.5s off
  **re-seeks**. Viewers' players are also locked (host-only controls), so they can't drift.
- **Late-joiner sync:** the room row persists the latest playback state; a joiner computes
  `position + elapsed`, and also requests a fresh state from the host on join.
- **Chat / queue / reactions / countdown:** broadcast events (chat & queue are also persisted to
  Postgres; optimistic on the sender).
- **Presence:** drives the live participant list and join/leave.

## Database Schema

Schema **`eleven_auction`** (isolated from the project's `public` schema). Tables:

- `profiles` — `id → auth.users`, `display_name`, `avatar_color`
- `rooms` — `code`, `name`, `host_id`, `is_public`, `status`, and the playback source-of-truth
  columns `current_item_id`, `is_playing`, `position_seconds`, `playback_updated_at`
- `queue_items` — `room_id`, `youtube_video_id`, `url`, `title`, `position`, `added_by`, `played`
- `messages` — `room_id`, `user_id`, `display_name`, `content`, `type` (chat/system)
- `room_participants` — `room_id`, `user_id`, `role` (host/viewer), unique per (room, user)

Row Level Security is enabled on all tables (helpers `is_room_member` / `is_room_host`); a trigger
`handle_new_user` auto-creates a profile on signup. Full DDL in
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and
[`0002_reset_rls.sql`](supabase/migrations/0002_reset_rls.sql).

## AI Usage

Built primarily with **Claude Code**. Session transcripts and a breakdown of what AI did vs. the
manual decisions are in **[`ai-transcripts/`](ai-transcripts/)** (see
[`ai-usage-summary.md`](ai-transcripts/ai-usage-summary.md)).

## Running Locally

**Prerequisites:** Node 20.9+ (Node 22 recommended), pnpm, and a Supabase project.

```bash
pnpm install
cp .env.example .env.local     # fill in your Supabase keys (see below)
```

**Supabase setup (one time):**
1. **Apply the schema:** in the Supabase dashboard → **SQL Editor**, run
   `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_reset_rls.sql`.
2. **Expose the schema:** **Settings → API → Exposed schemas** → add `eleven_auction`.
3. **Email auth:** **Authentication → Sign In / Providers → Email** → enable the provider and turn
   **off** "Confirm email" (so signups work instantly for the demo).
4. **Seed demo data:** `pnpm seed` (creates the demo accounts + the `DEMO01` room).

**Run it:**
```bash
pnpm dev      # http://localhost:3000
```

Useful scripts: `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm seed`.

## Environment Variables

See [`.env.example`](.env.example). All are required:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe; RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** — privileged writes (room joins) + seeding |
| `NEXT_PUBLIC_SITE_URL` | Base URL for building invite links |

## Known Limitations

- **YouTube only** (no raw MP4 / other providers yet); videos must be embeddable.
- **Desktop-first** — the room layout targets desktop (per the assignment, responsiveness isn't
  graded). The chat/queue sidebar is hidden on narrow screens.
- **No host hand-off** — if the host leaves, playback freezes at the last state; viewers can still
  chat/react. A new host isn't auto-promoted.
- **Clock skew** — drift math uses client clocks; large skew could shift sync by a second or two.
- Room channels are public-by-obscurity (keyed by room UUID); fine for this scope, not hardened
  for hostile multi-tenant use.

## Future Improvements

- Host transfer / co-host roles; kick & moderation.
- Support raw video URLs and other providers.
- Polls, voice notes, "start at the same time" scheduling.
- Server-timestamp-based sync to eliminate clock skew.
- Mobile-optimized viewing mode.

## Assumptions

- YouTube is the primary source (the IFrame API gives precise sync control).
- Desktop-first is acceptable (stated in the brief).
- Host-authoritative playback is the right model for "don't permanently desync."
- Free-tier Supabase/Vercel; built for small, friendly rooms, not large-scale load.
