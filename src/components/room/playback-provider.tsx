"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useRoom } from "@/components/room/room-provider";
import type { QueueItem } from "@/types/database";

type PlaybackContextValue = {
  currentItem: QueueItem | null;
  isPlaying: boolean;
  playerReady: boolean;
  canControl: boolean;
  togglePlay: () => void;
  playItem: (itemId: string) => void;
  next: () => void;
  hasNext: boolean;
  // Wiring for the <YouTubePlayer> component:
  registerPlayer: (player: YT.Player) => void;
  handleStateChange: (state: number) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within a PlaybackProvider");
  return ctx;
}

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const { room, queue, isHost } = useRoom();
  const supabase = useMemo(() => createClient(), []);

  const playerRef = useRef<YT.Player | null>(null);
  const loadedVideoRef = useRef<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(room.current_item_id);
  const [isPlaying, setIsPlaying] = useState(room.is_playing);

  const currentItem = useMemo(
    () => queue.find((q) => q.id === currentItemId) ?? null,
    [queue, currentItemId],
  );

  const currentIndex = currentItem ? queue.findIndex((q) => q.id === currentItem.id) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  // Host-only: persist playback state to the room (source of truth for late joiners).
  const persist = useCallback(
    async (partial: {
      is_playing?: boolean;
      position_seconds?: number;
      current_item_id?: string | null;
    }) => {
      if (!isHost) return;
      if (partial.current_item_id?.startsWith("temp-")) delete partial.current_item_id;
      await supabase
        .from("rooms")
        .update({ ...partial, playback_updated_at: new Date().toISOString() })
        .eq("id", room.id);
    },
    [isHost, supabase, room.id],
  );

  // Initial position for a (possibly late) joiner, derived from the room snapshot.
  const joinPosition = useCallback(() => {
    const base = room.position_seconds;
    if (!room.is_playing) return base;
    const elapsed = (Date.now() - new Date(room.playback_updated_at).getTime()) / 1000;
    return Math.max(0, base + elapsed);
  }, [room.position_seconds, room.is_playing, room.playback_updated_at]);

  const registerPlayer = useCallback(
    (player: YT.Player) => {
      playerRef.current = player;
      setPlayerReady(true);

      if (currentItem) {
        const start = joinPosition();
        loadedVideoRef.current = currentItem.youtube_video_id;
        if (room.is_playing) {
          player.loadVideoById({ videoId: currentItem.youtube_video_id, startSeconds: start });
        } else {
          player.cueVideoById({ videoId: currentItem.youtube_video_id, startSeconds: start });
        }
      }
    },
    // currentItem/joinPosition/room.is_playing captured for the one-time initial sync
    [currentItem, joinPosition, room.is_playing],
  );

  const playItem = useCallback(
    (itemId: string) => {
      const item = queue.find((q) => q.id === itemId);
      if (!item) return;
      setCurrentItemId(itemId);
      setIsPlaying(true);
      loadedVideoRef.current = item.youtube_video_id;
      playerRef.current?.loadVideoById({ videoId: item.youtube_video_id, startSeconds: 0 });
      void persist({ current_item_id: itemId, is_playing: true, position_seconds: 0 });
    },
    [queue, persist],
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  }, [isPlaying]);

  const next = useCallback(() => {
    if (currentIndex < 0) {
      if (queue[0]) playItem(queue[0].id);
      return;
    }
    const upcoming = queue[currentIndex + 1];
    if (upcoming) {
      playItem(upcoming.id);
    } else {
      setIsPlaying(false);
      playerRef.current?.pauseVideo();
      void persist({ is_playing: false });
    }
  }, [currentIndex, queue, playItem, persist]);

  const handleStateChange = useCallback(
    (state: number) => {
      const player = playerRef.current;
      if (state === YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        void persist({ is_playing: true, position_seconds: player?.getCurrentTime() ?? 0 });
      } else if (state === YT.PlayerState.PAUSED) {
        setIsPlaying(false);
        void persist({ is_playing: false, position_seconds: player?.getCurrentTime() ?? 0 });
      } else if (state === YT.PlayerState.ENDED) {
        if (isHost) next();
      }
    },
    [persist, isHost, next],
  );

  // Periodic position checkpoint (host) — keeps late joiners accurate.
  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (player && isPlaying) {
        void persist({ position_seconds: player.getCurrentTime(), is_playing: true });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [isHost, isPlaying, persist]);

  const value: PlaybackContextValue = {
    currentItem,
    isPlaying,
    playerReady,
    canControl: isHost,
    togglePlay,
    playItem,
    next,
    hasNext,
    registerPlayer,
    handleStateChange,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
