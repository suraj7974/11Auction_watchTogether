"use client";

import { useEffect, useRef } from "react";

import { loadYouTubeIframeApi } from "@/lib/youtube-iframe";
import { usePlayback } from "@/components/room/playback-provider";

/**
 * Renders the YouTube IFrame player. Created exactly once; the latest callbacks
 * are read from refs so queue/state changes never tear down the player.
 */
export function YouTubePlayer() {
  const { registerPlayer, handleStateChange } = usePlayback();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const registerRef = useRef(registerPlayer);
  registerRef.current = registerPlayer;
  const stateRef = useRef(handleStateChange);
  stateRef.current = handleStateChange;

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then((api) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new api.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => registerRef.current(e.target),
          onStateChange: (e) => stateRef.current(e.data),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="size-full" />
    </div>
  );
}
