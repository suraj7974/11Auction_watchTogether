# AI Usage Summary

## Tools used

- **Claude Code** (Anthropic) — primary tool for architecture, implementation, debugging, and docs.

## Transcripts in this folder

The Claude Code sessions were exported with `/export` as the project was built, checkpoint by
checkpoint:

```
ai-transcripts/
  2026-06-28-184005-project-start.txt
  2026-06-28-195519-auth-dashboard-landing.txt
  2026-06-28-212436-queue-realtime-sync.txt
  2026-06-29-141654-emoji-docs.txt
  2026-06-30-feature-iteration.txt          # post-core extras (see below)
```

(Some sessions are combined; filenames reflect the main work in each.)

After the core 11 checkpoints, a second wave of work added the **extras**: live polls, a fullscreen
theater mode with a YouTube-style side chat, **host transfer** (plus a deniable hand-off prompt when
the host leaves), a **mobile-friendly** stacked/tabbed layout, **synced captions**, **private rooms
with knock-to-join** admission, and **voice notes** (record → Supabase Storage → play in chat).
Alongside these, the UI got a glassmorphism pass with an animated dither background (scoped to the
landing/auth pages), an on-theme polish (text selection, button cursors), a no-flash welcome intro,
and an audit of loading/empty/error states (YouTube player errors now toast + auto-skip; DB read
failures surface as errors rather than empty states).

## How the work was directed

The project was built in **reviewed checkpoints**. After each checkpoint the human reviewed the
diff, committed it manually, and only then continued — so every change was inspected, not
auto-applied in one shot.

Key decisions were made by the human up front (via explicit choices): the **stack**
(Next.js + Supabase + Vercel), **full email/password auth + demo account**, and **which extra
features** to build — first host-only controls, reactions, queue, and countdown, then a second wave
(polls, fullscreen, host transfer, mobile mode, captions, private rooms, voice notes) each requested
and reviewed one at a time.

## What AI helped with

- Reading the assignment and turning Option 4 into a concrete plan.
- Initial architecture and the host-authoritative realtime design.
- Database schema, RLS policies, helper functions, and the seed script.
- Auth (Supabase SSR, the Next.js 16 `proxy` convention), the YouTube player integration, and the
  realtime engine (presence + broadcast, drift correction, late-joiner sync).
- **Debugging**: diagnosing a "row violates RLS" join failure with targeted reproduction scripts,
  and fixing a `supabase-js` custom-schema typing issue.
- The **extras** (second wave): live polls, fullscreen + side chat, host transfer & hand-off,
  mobile layout, synced captions, private-room knock/admit (service-role), and voice notes
  (MediaRecorder → Storage upload → in-chat player), plus the UI/glassmorphism redesign.
- All documentation.

## Important manual decisions

- **Used a dedicated `eleven_auction` schema** (instead of `public`) to isolate the app inside an
  existing Supabase project — which then required exposing the schema and adjusting the typed
  clients.
- **Service-role membership writes.** When a server-side participant insert intermittently failed
  RLS, we chose to perform the verified self-join with the service role rather than loosen the
  policies — keeping RLS strict everywhere else.
- **Broadcast instead of `postgres_changes`** for chat/queue/playback — simpler and lower latency
  with a custom schema, while still persisting data via inserts.
- **Host-authoritative sync with a drift heartbeat and locked viewer controls** — chosen because it
  is the most reliable way to satisfy "multiple users should not permanently desync."
- **Checkpoint + manual-commit workflow** — to keep the history clean and every change reviewed.

## What was reviewed / changed from AI output

- AI's first migration targeted `public`; rewrote it for `eleven_auction` and added the needed
  grants + schema exposure.
- AI's auth-error messaging was made friendlier (mapped Supabase errors; info vs. error styling).
- Reaction picker was moved out of the video frame into the chat panel on review.
- Verified AI's RLS/policies and realtime behavior with reproduction scripts before trusting them.
- The animated dither background was iterated on the human's feedback (lighter, then scoped to only
  the landing/auth pages — not the dashboard/room).
- Private-room enforcement was tightened after the human spotted that anyone with the link could
  still join (the code is in the URL); admission is now host-gated via a service-role write.
- Fullscreen controls were repositioned after the human noticed the YouTube logo colliding with the
  side-chat toggle.

## Known limitations (also in the README)

- YouTube-only; host hand-off is manual (not auto-promoted); sync uses client clocks (small skew
  possible); voice notes use the browser's native audio format, so a Chrome-recorded WebM/Opus clip
  may not play back in Safari.
