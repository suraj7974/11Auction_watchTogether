"use client";

import { useRoom } from "@/components/room/room-provider";
import { youTubeThumbnail } from "@/lib/youtube";

// Placeholder video surface. Checkpoint 6 swaps this for the synced YouTube player.
export function VideoStage() {
  const { room, queue } = useRoom();
  const current = queue.find((q) => q.id === room.current_item_id) ?? queue[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youTubeThumbnail(current.youtube_video_id)}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white">
              <span className="text-4xl">▶️</span>
              <p className="text-sm font-medium">Synced player loads here</p>
              <p className="max-w-xs text-xs text-white/70">
                The YouTube player and play/pause/seek sync arrive in the next step.
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white/80">
            <span className="text-4xl">🎬</span>
            <p className="text-sm font-medium">No video yet</p>
            <p className="max-w-xs text-xs text-white/60">
              Add a YouTube link from the Queue tab to get started.
            </p>
          </div>
        )}
      </div>

      <div className="min-h-6">
        {current && (
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {current.title ?? "YouTube video"}
          </h2>
        )}
      </div>
    </div>
  );
}
