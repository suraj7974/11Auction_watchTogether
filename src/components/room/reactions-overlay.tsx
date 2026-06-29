"use client";

import { useEffect, useRef, useState } from "react";

import { useRoom } from "@/components/room/room-provider";

export const REACTION_EMOJIS = ["❤️", "😂", "🔥", "👏", "😮", "🎉"];

type Floater = { id: string; emoji: string; left: number };

/** Floating emoji reactions that rise over the video. */
export function ReactionsFloaters() {
  const { onBroadcast } = useRoom();
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const spawn = (emoji: string) => {
    const id = crypto.randomUUID();
    const left = 8 + Math.random() * 80;
    setFloaters((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 2800);
  };
  const spawnRef = useRef(spawn);
  spawnRef.current = spawn;

  useEffect(
    () => onBroadcast("reaction", (payload) => spawnRef.current((payload as { emoji: string }).emoji)),
    [onBroadcast],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {floaters.map((f) => (
        <span
          key={f.id}
          className="animate-float-up absolute bottom-8 text-3xl drop-shadow"
          style={{ left: `${f.left}%` }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

/** Emoji picker bar — lives in the chat panel. */
export function ReactionBar() {
  const { sendReaction } = useRoom();
  return (
    <div className="flex items-center justify-center gap-1 border-t px-3 py-2">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => sendReaction(e)}
          aria-label={`React ${e}`}
          className="rounded-full px-1.5 text-xl leading-none transition-transform hover:scale-125"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
