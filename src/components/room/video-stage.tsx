"use client";

import { Film } from "lucide-react";

import { usePlayback } from "@/components/room/playback-provider";
import { YouTubePlayer } from "@/components/room/youtube-player";
import { ReactionsFloaters } from "@/components/room/reactions-overlay";
import { CountdownOverlay } from "@/components/room/countdown-overlay";

export function VideoStage() {
  const { currentItem, canControl } = usePlayback();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        {/* Player is always mounted so it's ready the moment a host hits play. */}
        <YouTubePlayer />

        {!currentItem && (
          <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-black/80 text-center text-white/80">
            <Film className="size-10 text-white/70" />
            <p className="text-sm font-medium">No video playing</p>
            <p className="max-w-xs text-xs text-white/60">
              {canControl
                ? "Add a YouTube link in the Queue tab, then press play."
                : "Waiting for the host to start a video."}
            </p>
          </div>
        )}

        {/* Host-only control lock: block viewers from touching the player so they
            can't desync. Playback follows the host automatically. */}
        {!canControl && currentItem && (
          <div
            className="absolute inset-0 z-10"
            title="The host controls playback"
            aria-hidden
          />
        )}

        <ReactionsFloaters />
        <CountdownOverlay />
      </div>

      <div className="min-h-7">
        {currentItem && (
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {currentItem.title ?? "YouTube video"}
          </h2>
        )}
      </div>
    </div>
  );
}
