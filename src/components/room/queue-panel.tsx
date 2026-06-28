"use client";

import { useState } from "react";
import { Plus, Play, X } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { usePlayback } from "@/components/room/playback-provider";
import { youTubeThumbnail } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function QueuePanel() {
  const { queue, isHost, currentUser, addToQueue, removeFromQueue } = useRoom();
  const { currentItem, playItem } = usePlayback();
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || adding) return;
    setAdding(true);
    const ok = await addToQueue(url);
    setAdding(false);
    if (ok) setUrl("");
  }

  return (
    <div className="flex h-full flex-col">
      <form onSubmit={handleAdd} className="flex items-center gap-2 border-b p-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube link…"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={!url.trim() || adding} aria-label="Add to queue">
          <Plus className="size-4" />
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto p-2">
        {queue.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <span className="text-2xl">📺</span>
            <p>Queue is empty</p>
            <p className="text-xs">Paste a YouTube link above to add the first video.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {queue.map((item) => {
              const isCurrent = currentItem?.id === item.id;
              const canRemove = isHost || item.added_by === currentUser.id;
              const canPlay = isHost && !isCurrent && !item.id.startsWith("temp-");
              return (
                <li
                  key={item.id}
                  className="group flex items-center gap-3 rounded-md p-1.5 hover:bg-muted"
                >
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={youTubeThumbnail(item.youtube_video_id)}
                      alt=""
                      className="aspect-video w-20 rounded object-cover"
                    />
                    {canPlay && (
                      <button
                        type="button"
                        onClick={() => playItem(item.id)}
                        aria-label="Play now"
                        className="absolute inset-0 flex items-center justify-center rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Play className="size-5 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.title ?? "YouTube video"}
                    </p>
                    {isCurrent && (
                      <Badge variant="secondary" className="mt-0.5 gap-1">
                        <Play className="size-3" /> Now playing
                      </Badge>
                    )}
                  </div>
                  {canRemove && !isCurrent && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      aria-label="Remove from queue"
                      onClick={() => removeFromQueue(item.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
