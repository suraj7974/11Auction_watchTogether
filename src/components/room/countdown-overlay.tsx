"use client";

import { useEffect, useState } from "react";

import { usePlayback } from "@/components/room/playback-provider";

/** Full-screen "3 · 2 · 1 · Go!" overlay synced across the room. */
export function CountdownOverlay() {
  const { countdownEndsAt } = usePlayback();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (countdownEndsAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [countdownEndsAt]);

  if (countdownEndsAt == null) return null;

  const remaining = countdownEndsAt - now;
  if (remaining <= -500) return null;

  const label = remaining <= 250 ? "Go!" : String(Math.max(1, Math.ceil(remaining / 1000)));

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
      <span key={label} className="animate-countdown-pop text-7xl font-bold text-white drop-shadow-lg">
        {label}
      </span>
    </div>
  );
}
