# AI Usage Summary

## Tools used

- **Claude Code** (Anthropic) — primary tool for architecture, implementation, debugging, and docs.

## Transcripts in this folder

The Claude Code sessions were exported with `/export` as the project was built, checkpoint by
checkpoint:

```
ai-transcripts/
  claude-session-1.txt   # planning + project scaffold
  claude-session-2.txt   # Supabase schema, RLS, seed
  claude-session-3.txt   # auth + profiles
  claude-session-4.txt   # landing + dashboard
  claude-session-5.txt   # room shell UI
  claude-session-6.txt   # YouTube player + host controls
  claude-session-7.txt   # RLS join fix + realtime sync engine
  claude-session-8.txt   # extras (host lock, reactions, countdown)
  claude-session-9.txt   # polish
  ...                    # docs + deploy
```

(Some sessions are combined; filenames reflect the main work in each.)

## How the work was directed

The project was built in **reviewed checkpoints**. After each checkpoint the human reviewed the
diff, committed it manually, and only then continued — so every change was inspected, not
auto-applied in one shot.

Key decisions were made by the human up front (via explicit choices): the **stack**
(Next.js + Supabase + Vercel), **full email/password auth + demo account**, and **which extra
features** to build (host-only controls, reactions, queue, countdown).

## What AI helped with

- Reading the assignment and turning Option 4 into a concrete plan.
- Initial architecture and the host-authoritative realtime design.
- Database schema, RLS policies, helper functions, and the seed script.
- Auth (Supabase SSR, the Next.js 16 `proxy` convention), the YouTube player integration, and the
  realtime engine (presence + broadcast, drift correction, late-joiner sync).
- **Debugging**: diagnosing a "row violates RLS" join failure with targeted reproduction scripts,
  and fixing a `supabase-js` custom-schema typing issue.
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

## Known limitations (also in the README)

- YouTube-only; desktop-first; no host hand-off; sync uses client clocks (small skew possible).
