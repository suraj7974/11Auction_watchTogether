# Overview — The Challenge & How This Solution Solves It

A plain-language guide: what the assignment asked for, and how this app delivers it.

---

## The challenge, in one line

Build a **watch-party platform**: one person makes a room, adds a YouTube link, invites friends,
and everyone watches **in sync** — if someone pauses or seeks, it updates for everyone — with live
chat. Realtime correctness is the heart of the grade.

## What a user actually does (the flow)

1. **Land & sign in.** Open the site → sign up, log in, or click **Try the demo**.
2. **Dashboard.** Create a room (you become the host) or join one with a code. There's also a
   one-click **demo room**.
3. **In the room.**
   - The **host** pastes a YouTube link into the **Queue**, then presses **Play**.
   - Everyone's video starts together and stays together — pause, resume, and seek all sync.
   - People **chat** on the side, drop **emoji reactions** that float over the video, send **voice
     notes**, vote in **live polls**, and see who else is **in the room**.
   - The host can run a **3 · 2 · 1 countdown**, **hand the host role** to someone else, and go
     **fullscreen** with a side chat.
4. **Invite.** Share the room link; anyone who opens it joins and **jumps to the current moment** —
   unless it's a **private room**, where the host **admits each person** first.

## How each requirement is met

| The brief asked for… | How this app does it |
|----------------------|----------------------|
| Create a watch room | Dashboard "Create a room" → you're the host |
| Join by link/code | Join-by-code form + shareable invite links (`/room/CODE`) |
| Add a YouTube URL | Paste in the Queue; the app parses the video ID |
| Shared player | YouTube player embedded in the room |
| **Play/pause/seek sync** | Host's actions broadcast to everyone in realtime; viewers follow |
| **Realtime chat** | Messages appear instantly for everyone (and are saved) |
| Participants list | Live "People" tab powered by presence |
| **Late-joiner sync** | New joiners start at the correct timestamp (saved state + a live nudge from the host) |
| **No permanent desync** | Host is the source of truth; a heartbeat re-aligns anyone who drifts; viewers' controls are locked |
| Room persistence | Rooms, queue, chat, and playback position are stored in the database |

## Beyond the brief (extras)

On top of the required features, the app adds: **host transfer** (with a deniable prompt when the
host leaves), **private rooms** where the host admits each person (knock-to-join), **live polls**,
**voice notes** in chat, **synced captions**, a **fullscreen theater mode** with an optional side
chat, and a **mobile-friendly** stacked/tabbed layout. See the README's *Features* section.

## Why these choices

- **One source of truth (the host).** The simplest reliable way to keep everyone together is to let
  the host's player decide, and have everyone else follow. This is what guarantees the room can't
  *permanently* fall out of sync.
- **Heartbeat + auto-correct.** Even if a viewer's connection hiccups, a steady "here's where we
  are" signal pulls them back within ~1.5 seconds.
- **Locked viewer controls.** Viewers can't accidentally pause or scrub the shared video — they
  just watch. Reactions and chat are how they participate.
- **Supabase for everything backend.** Database, login, and realtime in one place means a single,
  clean deployment that's fully TypeScript end-to-end.

## What's intentionally out of scope

- Non-YouTube videos (YouTube only, for precise sync) and co-host/moderation roles. Voice notes use
  the browser's native audio format, so a clip recorded in Chrome may not play back in Safari. These
  are listed as future improvements in the README.

## Where to look next

- **Try it:** demo credentials are in the [README](../README.md#demo-credentials).
- **How it's built:** [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md).
- **How AI was used:** [`../ai-transcripts/ai-usage-summary.md`](../ai-transcripts/ai-usage-summary.md).
