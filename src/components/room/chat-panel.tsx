"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MessageSquare, SendHorizontal, Trash2 } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { ReactionBar } from "@/components/room/reactions-overlay";
import { ActivePoll } from "@/components/room/active-poll";
import { CreatePollButton } from "@/components/room/create-poll-button";
import { VoiceMessage } from "@/components/room/voice-message";
import { useVoiceRecorder, MAX_VOICE_SECONDS } from "@/components/room/use-voice-recorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function clock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ChatPanel() {
  const { messages, currentUser, sendMessage, sendVoiceNote } = useRoom();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { recording, seconds, start, finish, cancel } = useVoiceRecorder();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    await sendMessage(content);
    setSending(false);
  }

  async function sendRecording() {
    const blob = await finish();
    if (blob) await sendVoiceNote(blob, seconds || 1);
  }

  // Auto-send when the max duration is reached.
  useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) void sendRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, seconds]);

  return (
    <div className="flex h-full flex-col">
      <ActivePoll />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-8" />
            <p>No messages yet</p>
            <p className="text-xs">Say hi while you wait for the video to start.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              if (m.type === "system") {
                return (
                  <li key={m.id} className="text-center text-xs text-muted-foreground">
                    {m.content}
                  </li>
                );
              }
              const mine = m.user_id === currentUser.id;
              return (
                <li key={m.id} className={cn("flex flex-col gap-0.5", mine && "items-end")}>
                  <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {mine ? "You" : m.display_name}
                    </span>
                    <span>{formatTime(m.created_at)}</span>
                  </div>
                  {m.type === "voice" ? (
                    <VoiceMessage content={m.content} mine={mine} />
                  ) : (
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-1.5 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {m.content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <ReactionBar />

      {recording ? (
        <div className="flex items-center gap-2 p-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={cancel}
            aria-label="Discard recording"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
          <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="tabular-nums">{clock(seconds)}</span>
            <span className="text-muted-foreground">Recording…</span>
          </div>
          <Button type="button" size="icon" onClick={sendRecording} aria-label="Send voice note">
            <SendHorizontal className="size-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          <CreatePollButton />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={start}
            aria-label="Record a voice note"
          >
            <Mic className="size-4" />
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message…"
            maxLength={500}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Send">
            <SendHorizontal className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
