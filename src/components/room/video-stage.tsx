"use client";

import { useEffect, useRef, useState } from "react";
import { Film, Maximize, Minimize, MessageSquare, PanelRightClose } from "lucide-react";

import { usePlayback } from "@/components/room/playback-provider";
import { YouTubePlayer } from "@/components/room/youtube-player";
import { ReactionsFloaters } from "@/components/room/reactions-overlay";
import { CountdownOverlay } from "@/components/room/countdown-overlay";
import { ChatPanel } from "@/components/room/chat-panel";
import { cn } from "@/lib/utils";

export function VideoStage() {
  const { currentItem, canControl } = usePlayback();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  };

  const ctrlBtn =
    "flex cursor-pointer items-center justify-center rounded-md bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70";

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={rootRef}
        className={cn(isFullscreen ? "fixed inset-0 z-50 flex bg-black" : "relative")}
      >
        {/* Video column */}
        <div
          className={cn(
            "group relative overflow-hidden bg-black",
            isFullscreen ? "min-w-0 flex-1" : "aspect-video w-full rounded-xl border",
          )}
        >
          {/* Always mounted so it survives fullscreen toggles without reloading. */}
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

          {/* Host-only lock: viewers can't touch the player (no desync). */}
          {!canControl && currentItem && (
            <div className="absolute inset-0 z-10" title="The host controls playback" aria-hidden />
          )}

          <ReactionsFloaters />
          <CountdownOverlay />

          {/* Custom controls (fullscreen + chat toggle). In fullscreen they're
              lifted above YouTube's own control bar so they don't collide. */}
          <div
            className={cn(
              "absolute right-3 z-40 flex gap-2",
              isFullscreen ? "bottom-16" : "bottom-3",
            )}
          >
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setChatOpen((o) => !o)}
                className={ctrlBtn}
                aria-label={chatOpen ? "Hide chat" : "Show chat"}
                title={chatOpen ? "Hide chat" : "Show chat"}
              >
                {chatOpen ? <PanelRightClose className="size-4" /> : <MessageSquare className="size-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={ctrlBtn}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>

        {/* Chat column — only in fullscreen, YouTube-style */}
        {isFullscreen && chatOpen && (
          <aside className="flex w-[340px] shrink-0 flex-col border-l border-white/10 bg-background">
            <div className="flex h-11 items-center justify-between border-b px-3 text-sm font-medium">
              <span>Live chat</span>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Hide chat"
              >
                <PanelRightClose className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatPanel />
            </div>
          </aside>
        )}
      </div>

      {!isFullscreen && (
        <div className="min-h-7">
          {currentItem && (
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {currentItem.title ?? "YouTube video"}
            </h2>
          )}
        </div>
      )}
    </div>
  );
}
