"use client";

import { useEffect, useRef } from "react";

import { loadYouTubeIframeApi } from "@/lib/youtube-iframe";
import { usePlayback } from "@/components/room/playback-provider";

/**
 * Renders the YouTube IFrame player. Created exactly once; the latest callbacks
 * are read from refs so queue/state changes never tear down the player.
 */
export function YouTubePlayer() {
  const { registerPlayer, handleStateChange, handlePlayerError, handleApiChange, canControl } =
    usePlayback();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const registerRef = useRef(registerPlayer);
  const stateRef = useRef(handleStateChange);
  const errorRef = useRef(handlePlayerError);
  const apiRef = useRef(handleApiChange);
  // Host gets native controls; viewers get a controls-free, follow-only player.
  const canControlRef = useRef(canControl);

  // Keep the latest callbacks without re-creating the player.
  useEffect(() => {
    registerRef.current = registerPlayer;
    stateRef.current = handleStateChange;
    errorRef.current = handlePlayerError;
    apiRef.current = handleApiChange;
  });

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then((api) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new api.Player(containerRef.current, {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: canControlRef.current ? 1 : 0,
          disablekb: canControlRef.current ? 0 : 1,
          fs: 0, // we provide our own fullscreen (with side chat)
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => registerRef.current(e.target),
          onStateChange: (e) => stateRef.current(e.data),
          onError: () => errorRef.current(),
          onApiChange: () => apiRef.current(),
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
