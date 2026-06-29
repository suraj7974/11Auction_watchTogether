"use client";

import { useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Compact audio player for a voice note. `content` is "<url>|<durationSeconds>". */
export function VoiceMessage({ content, mine }: { content: string; mine: boolean }) {
  const sep = content.lastIndexOf("|");
  const url = sep === -1 ? content : content.slice(0, sep);
  const duration = sep === -1 ? 0 : Number(content.slice(sep + 1)) || 0;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else void a.play();
  };

  return (
    <div
      className={cn(
        "flex max-w-[85%] items-center gap-2.5 rounded-lg px-3 py-2",
        mine ? "bg-primary text-primary-foreground" : "bg-muted",
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-current/15"
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>

      <div className="flex items-center gap-1.5">
        <Mic className="size-3.5 opacity-70" />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-current/20">
          <div className="h-full rounded-full bg-current" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <span className="text-xs tabular-nums opacity-80">{fmt(duration)}</span>

      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (duration) setProgress(Math.min(1, a.currentTime / duration));
        }}
      />
    </div>
  );
}
