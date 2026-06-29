# Project Documentation — Watch Together Platform

Technical reference for the codebase: structure, data model, realtime engine, auth, and the key
engineering decisions.

---

## 1. Module map

```
src/
├── proxy.ts                      # Next 16 "middleware" — session refresh + route protection
├── app/
│   ├── page.tsx                  # public landing (redirects authed users to /dashboard)
│   ├── (auth)/                   # login, signup, shared AuthForm + layout
│   ├── dashboard/                # create/join rooms, "your rooms", + loading skeleton
│   ├── room/[code]/              # the room (server load → <RoomView/>), loading skeleton
│   ├── error.tsx / not-found.tsx # global error + 404 states
│   └── layout.tsx                # Toaster + TooltipProvider + metadata
├── components/
│   ├── room/                     # RoomProvider, PlaybackProvider, panels, player, overlays
│   │   ├── poll-provider.tsx, active-poll.tsx, create-poll-button.tsx   # live polls
│   │   ├── voice-message.tsx, use-voice-recorder.ts                     # voice notes
│   │   ├── waiting-room.tsx, knock-manager.tsx                          # private-room knock/admit
│   │   └── video-stage.tsx                                              # fullscreen + side chat
│   ├── dashboard/                # create-room / join-room forms
│   ├── app-header.tsx, user-avatar.tsx
│   └── ui/                       # shadcn components
├── lib/
│   ├── supabase/                 # client (browser), server (SSR), admin (service role), queries
│   ├── rooms/                    # actions (create/join/admit/transfer-host), codes, membership
│   ├── youtube.ts                # URL/ID parsing + thumbnail helpers
│   └── youtube-iframe.ts         # loads the IFrame Player API once
├── types/                        # database.ts (schema types) + room.ts (view models)
supabase/
├── migrations/0001_init.sql      # schema, RLS, helpers, trigger, realtime publication
├── migrations/0002_reset_rls.sql # authoritative RLS reset (fixes drift)
├── migrations/0003_voice_notes.sql # voice message type + public voice-notes Storage bucket
└── seed.ts                       # demo accounts + DEMO01 room (service role)
```

## 2. Request & data flow

- **Auth gate:** `proxy.ts` runs on every request, refreshes the Supabase session cookie, and
  redirects unauthenticated users to `/login` (public paths: `/`, `/login`, `/signup`).
- **Room load (server):** `app/room/[code]/page.tsx` verifies the user, ensures membership
  (`ensureMembership`), then loads the **room bundle** (`getRoomBundle`: room + queue + messages +
  participants) and hands it to the client `<RoomView/>`.
- **Client state:** `RoomProvider` holds messages/queue/participants/connection and owns the
  realtime channel. `PlaybackProvider` (nested) owns the YouTube player + playback logic.

## 3. Realtime engine

One Supabase Realtime channel per room: `room:{roomId}`, configured with `presence` and
`broadcast: { self: false }`.

| Concern | Mechanism |
|--------|-----------|
| Participants | **presence** — each client `track()`s `{userId, displayName, avatarColor, role}`; the list rebuilds on `sync` (always includes self) |
| Chat | DB insert (persist) + **broadcast** `chat`; optimistic on sender, dedup by id |
| Queue add/remove | DB write + **broadcast** `queue_add` / `queue_remove` |
| Playback | host **broadcast** `pb` `{currentItemId, videoId, positionSeconds, isPlaying, emittedAt}` |
| Late-joiner sync | viewer **broadcast** `req` on join → host replies with `pb`; plus DB snapshot |
| Reactions | **broadcast** `reaction` `{emoji}` (also dispatched locally so the sender sees it) |
| Countdown | host **broadcast** `countdown` `{endsAt}`; everyone renders, host plays at zero |
| Voice notes | upload clip to the `voice-notes` Storage bucket → DB insert (persist) + **broadcast** `chat` with `type: "voice"` and `content = "<url>\|<seconds>"` |
| Polls | host **broadcast** `poll_open` / `poll_vote` / `poll_close`; tally is ephemeral (not persisted) |
| Host transfer | **broadcast** `host_change` `{hostId}` → every client updates its reactive `hostId`; the admit/transfer write uses the service role |
| Private rooms | waiting client **broadcast** `knock` every 5s → host replies `admit` (client reloads) or `deny` |
| Captions | host's `onApiChange` reads the active caption track into `pb`; viewers `loadModule`/`unloadModule` to match |

Several of these are **generic broadcast events** registered through a `GENERIC_BROADCAST_EVENTS`
array → `broadcastHandlers` map, consumed by panels via `onBroadcast(event, handler)`. Privileged
state changes (admit a knocker, transfer host) go through **server actions** using the service-role
client, but only ever for the verified current user / a real room member.

**Host-authoritative playback** (`PlaybackProvider`):
- The host's `onStateChange` (PLAYING/PAUSED/BUFFERING) persists to `rooms` and broadcasts `pb`.
- Viewers apply `pb`: load the video if changed, then seek to
  `positionSeconds + (isPlaying ? elapsedSince(emittedAt) : 0)`, and match play/pause.
- **Drift correction:** host heartbeat every 2.5s; viewers re-seek when |actual − expected| > 1.5s.
- **Host-only lock:** viewers' players are created with `controls: 0` and covered by a
  click-blocking overlay, so they can only follow.

Cross-provider wiring: the channel lives in `RoomProvider`, which exposes `broadcastPlayback`,
`requestSync`, `onPlaybackMessage`, and a generic `broadcast` / `onBroadcast`. `PlaybackProvider`
registers a single handler (stable, latest-callback via refs) to avoid tearing down the player.

### 3.1 Additional room features

- **Host transfer & hand-off.** `hostId` is reactive provider state (not just a server prop). Any
  host can promote another participant (`transferRoomHost` server action → `host_change` broadcast),
  and a host who leaves is prompted to hand off (deniable). Because the channel effect must not
  rebuild on host change, presence re-tracking lives in a separate effect keyed on `isHost`, and
  `syncPresence` reads `hostId` from a ref.
- **Private rooms (knock-to-join).** `room/[code]/page.tsx` gates entry: a non-member of a private
  room is shown `<WaitingRoom/>` (which knocks) instead of the room. The host's `<KnockManager/>`
  surfaces a deduped, non-expiring **Admit / Deny** toast; admit calls `admitToRoom` (service role)
  then broadcasts `admit`. This closes the "anyone with the link can join" hole, since the room code
  is in the URL.
- **Live polls.** `PollProvider` holds one active poll in memory; the host opens a poll, votes
  stream in over broadcast, and results render live in `<ActivePoll/>`. Ephemeral by design.
- **Voice notes.** `useVoiceRecorder` wraps `MediaRecorder` (mic permission, 60s cap, auto-send).
  `sendVoiceNote` uploads the clip to the public `voice-notes` bucket, persists a `type: "voice"`
  message, and broadcasts it; `<VoiceMessage/>` is a compact play/pause + progress player.
- **Fullscreen & mobile.** `<VideoStage/>` owns the Fullscreen API and a YouTube-style **side chat**
  (landscape only; portrait fullscreen is video-only). On phones the room reflows to a stacked
  layout with tabbed chat/queue/people.
- **Synced captions.** The host's caption track is read on `onApiChange` and carried in the playback
  payload; viewers load/unload the captions module to match, so toggling CC affects everyone.

## 4. Auth

- Email/password via Supabase Auth. `signIn` / `signUp` / `signOut` / `signInDemo` are **server
  actions** using `useActionState` for inline errors; signup metadata `display_name` flows into the
  `handle_new_user` trigger which creates the `profiles` row.
- `proxy.ts` calls `updateSession()` (in `lib/supabase/proxy-session.ts`) — the @supabase/ssr SSR
  pattern adapted to Next 16's `proxy` convention (Node runtime, async cookies).

## 5. Database & RLS

Tables live in the **`eleven_auction`** schema (see README for columns). RLS is enabled on all
tables, with `SECURITY DEFINER` helpers `is_room_member(room_id)` / `is_room_host(room_id)` to
avoid policy recursion. Highlights:
- `rooms`: any authed user can read (join-by-code); only the **host** can update — so host-only
  playback writes are enforced at the **database** layer, not just the UI.
- `room_participants`: insert allowed when `user_id = auth.uid()` (you may add yourself).
- `messages` / `queue_items`: read/write gated on room membership.

The realtime publication includes the app tables (`replica identity full`) for completeness,
though the app uses broadcast rather than `postgres_changes`.

`0003_voice_notes.sql` extends the `messages.type` check to allow `'voice'` and creates a public
`voice-notes` Storage bucket with policies (authenticated upload, public read) for the audio clips.

## 6. Key engineering decisions

- **Custom schema typing.** `supabase-js` resolves a schema's types to `never` unless the
  `Database` type satisfies `GenericSchema`. Two fixes were required: every table needs a
  `Relationships` field, and row types must be **`type` aliases, not `interface`s** (interfaces
  aren't assignable to `Record<string, unknown>`). Clients are created with
  `createClient<Database, "eleven_auction">(..., { db: { schema: "eleven_auction" } })`.
- **Membership via service role.** Adding a participant from the server occasionally failed RLS
  (`auth.uid()` not applied to that specific server-side write). `ensureMembership()` performs the
  join with the **service-role** client, but only ever for the **verified** current user. Reads and
  client-side writes still run as the user under RLS. See `lib/rooms/membership.ts`.
- **Broadcast over postgres_changes.** For a custom schema, `postgres_changes` realtime needs RLS
  authorization wiring; broadcast is simpler, lower-latency, and we already persist via inserts.
- **Single YouTube player instance.** The IFrame player is created once; latest callbacks are read
  from refs (updated in effects) so queue/state changes never recreate it.

## 7. Verification performed during development

- RLS create/join/read flows validated end-to-end with signed-in test users (and cleaned up).
- New-viewer join + chat read/post validated after the membership fix.
- Realtime transport validated: broadcast (chat + playback) delivered between two authenticated
  clients on the live project.
- `tsc --noEmit`, `pnpm lint`, and `pnpm build` all clean.

## 8. Deployment

Vercel project with the four env vars from the README set in the project settings. The Supabase
schema/seed steps (README §Running Locally) must be applied to the same project the keys point to.
