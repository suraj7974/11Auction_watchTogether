"use client";

import { usePlayback } from "@/components/room/playback-provider";
import { YouTubePlayer } from "@/components/room/youtube-player";

export function VideoStage() {
  const { currentItem, canControl } = usePlayback();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        {/* Player is always mounted so it's ready the moment a host hits play. */}
        <YouTubePlayer />

        {!currentItem && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-center text-white/80">
            <span className="text-4xl">🎬</span>
            <p className="text-sm font-medium">No video playing</p>
            <p className="max-w-xs text-xs text-white/60">
              {canControl
                ? "Add a YouTube link in the Queue tab, then press play."
                : "Waiting for the host to start a video."}
            </p>
          </div>
        )}
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
