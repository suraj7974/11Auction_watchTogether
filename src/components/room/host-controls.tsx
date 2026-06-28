"use client";

import { Pause, Play, SkipForward } from "lucide-react";

import { usePlayback } from "@/components/room/playback-provider";
import { useRoom } from "@/components/room/room-provider";
import { Button } from "@/components/ui/button";

export function HostControls() {
  const { canControl, isPlaying, currentItem, playerReady, togglePlay, playItem, next, hasNext } =
    usePlayback();
  const { queue } = useRoom();

  if (!canControl) return null;

  const firstPlayable = queue.find((q) => !q.id.startsWith("temp-"));

  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl border bg-card p-3">
      {currentItem ? (
        <Button size="sm" onClick={togglePlay} disabled={!playerReady}>
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => firstPlayable && playItem(firstPlayable.id)}
          disabled={!firstPlayable || !playerReady}
        >
          <Play className="size-4" /> Start watching
        </Button>
      )}

      <Button size="sm" variant="outline" onClick={next} disabled={!hasNext}>
        <SkipForward className="size-4" /> Next
      </Button>

      <span className="ml-auto text-xs text-muted-foreground">
        You&apos;re the host — you control playback for the room.
      </span>
    </div>
  );
}
