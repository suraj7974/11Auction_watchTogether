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

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { useRoom, type PlaybackBroadcast } from "@/components/room/room-provider";
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
  countdownEndsAt: number | null;
  startCountdown: () => void;
  registerPlayer: (player: YT.Player) => void;
  handleStateChange: (state: number) => void;
  handlePlayerError: () => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within a PlaybackProvider");
  return ctx;
}

const DRIFT_TOLERANCE = 1.5; // seconds before a viewer re-seeks
const HEARTBEAT_MS = 2500;

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const { room, queue, isHost, broadcastPlayback, requestSync, onPlaybackMessage, broadcast, onBroadcast } =
    useRoom();
  const supabase = useMemo(() => createClient(), []);

  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);

  const playerRef = useRef<YT.Player | null>(null);
  const loadedVideoRef = useRef<string | null>(null);
  const currentItemIdRef = useRef<string | null>(room.current_item_id);

  const [playerReady, setPlayerReady] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(room.current_item_id);
  const [isPlaying, setIsPlaying] = useState(room.is_playing);

  const setCurrent = useCallback((id: string | null) => {
    currentItemIdRef.current = id;
    setCurrentItemId(id);
  }, []);

  const currentItem = useMemo(
    () => queue.find((q) => q.id === currentItemId) ?? null,
    [queue, currentItemId],
  );
  const currentIndex = currentItem ? queue.findIndex((q) => q.id === currentItem.id) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  // Host-only: persist to the room (source of truth for SSR late joiners).
  const persist = useCallback(
    async (partial: { is_playing?: boolean; position_seconds?: number; current_item_id?: string | null }) => {
      if (!isHost) return;
      if (partial.current_item_id?.startsWith("temp-")) delete partial.current_item_id;
      await supabase
        .from("rooms")
        .update({ ...partial, playback_updated_at: new Date().toISOString() })
        .eq("id", room.id);
    },
    [isHost, supabase, room.id],
  );

  // Host-only: broadcast the live playback state to viewers.
  const emitState = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const state: PlaybackBroadcast = {
      currentItemId: currentItemIdRef.current,
      videoId: loadedVideoRef.current,
      positionSeconds: player.getCurrentTime?.() ?? 0,
      isPlaying: player.getPlayerState?.() === YT.PlayerState.PLAYING,
      emittedAt: Date.now(),
    };
    broadcastPlayback(state);
  }, [broadcastPlayback]);

  // Viewer-only: apply a host broadcast to the local player.
  const applyState = useCallback((s: PlaybackBroadcast) => {
    const player = playerRef.current;
    setCurrent(s.currentItemId);
    setIsPlaying(s.isPlaying);
    if (!player || !s.videoId) return;

    const target = s.positionSeconds + (s.isPlaying ? (Date.now() - s.emittedAt) / 1000 : 0);

    if (loadedVideoRef.current !== s.videoId) {
      loadedVideoRef.current = s.videoId;
      if (s.isPlaying) player.loadVideoById({ videoId: s.videoId, startSeconds: Math.max(0, target) });
      else player.cueVideoById({ videoId: s.videoId, startSeconds: Math.max(0, target) });
      return;
    }

    // Same video — correct drift and match play/pause.
    const actual = player.getCurrentTime?.() ?? 0;
    if (Math.abs(actual - target) > DRIFT_TOLERANCE) player.seekTo(Math.max(0, target), true);
    const ps = player.getPlayerState?.();
    if (s.isPlaying && ps !== YT.PlayerState.PLAYING) player.playVideo();
    if (!s.isPlaying && ps === YT.PlayerState.PLAYING) player.pauseVideo();
  }, [setCurrent]);

  // Initial position for a (possibly late) joiner from the room snapshot.
  const joinPosition = useCallback(() => {
    const base = room.position_seconds;
    if (!room.is_playing) return base;
    return Math.max(0, base + (Date.now() - new Date(room.playback_updated_at).getTime()) / 1000);
  }, [room.position_seconds, room.is_playing, room.playback_updated_at]);

  const registerPlayer = useCallback(
    (player: YT.Player) => {
      playerRef.current = player;
      setPlayerReady(true);
      if (currentItem) {
        loadedVideoRef.current = currentItem.youtube_video_id;
        const start = joinPosition();
        if (room.is_playing) player.loadVideoById({ videoId: currentItem.youtube_video_id, startSeconds: start });
        else player.cueVideoById({ videoId: currentItem.youtube_video_id, startSeconds: start });
      }
      // Ask the host for an up-to-the-moment state.
      requestSync();
    },
    [currentItem, joinPosition, room.is_playing, requestSync],
  );

  const playItem = useCallback(
    (itemId: string) => {
      const item = queue.find((q) => q.id === itemId);
      if (!item) return;
      setCurrent(itemId);
      setIsPlaying(true);
      loadedVideoRef.current = item.youtube_video_id;
      playerRef.current?.loadVideoById({ videoId: item.youtube_video_id, startSeconds: 0 });
      void persist({ current_item_id: itemId, is_playing: true, position_seconds: 0 });
      // emitState reads the player; broadcast shortly after the load registers.
      setTimeout(emitState, 250);
    },
    [queue, persist, emitState, setCurrent],
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
      emitState();
    }
  }, [currentIndex, queue, playItem, persist, emitState]);

  // Synchronized "starting in 3-2-1" countdown. Host triggers; everyone sees it;
  // host starts playback at zero (which then syncs via the playback broadcast).
  const startCountdown = useCallback(() => {
    if (!isHost) return;
    const duration = 3200;
    const endsAt = Date.now() + duration;
    setCountdownEndsAt(endsAt);
    broadcast("countdown", { endsAt });
    setTimeout(() => {
      const player = playerRef.current;
      if (currentItemIdRef.current && player) {
        player.playVideo();
      } else {
        const first = queue.find((q) => !q.id.startsWith("temp-"));
        if (first) playItem(first.id);
      }
    }, duration);
  }, [isHost, broadcast, queue, playItem]);

  // Viewers receive the countdown; clear it shortly after it ends.
  useEffect(() => {
    return onBroadcast("countdown", (payload) => {
      setCountdownEndsAt((payload as { endsAt: number }).endsAt);
    });
  }, [onBroadcast]);

  useEffect(() => {
    if (countdownEndsAt == null) return;
    const t = setTimeout(
      () => setCountdownEndsAt(null),
      Math.max(0, countdownEndsAt - Date.now()) + 700,
    );
    return () => clearTimeout(t);
  }, [countdownEndsAt]);

  const handleStateChange = useCallback(
    (state: number) => {
      const player = playerRef.current;
      if (state === YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        if (isHost) {
          void persist({ is_playing: true, position_seconds: player?.getCurrentTime() ?? 0 });
          emitState();
        }
      } else if (state === YT.PlayerState.PAUSED) {
        setIsPlaying(false);
        if (isHost) {
          void persist({ is_playing: false, position_seconds: player?.getCurrentTime() ?? 0 });
          emitState();
        }
      } else if (state === YT.PlayerState.BUFFERING) {
        if (isHost) emitState(); // propagates seeks
      } else if (state === YT.PlayerState.ENDED) {
        if (isHost) next();
      }
    },
    [isHost, persist, emitState, next],
  );

  // A video failed to load (private / removed / embedding disabled / region-blocked).
  const handlePlayerError = useCallback(() => {
    toast.error("Couldn't play this video", {
      description: hasNext
        ? "It may be private, removed, or not embeddable — skipping to the next one."
        : "It may be private, removed, or not embeddable.",
    });
    if (isHost) next();
  }, [isHost, hasNext, next]);

  // Register a single realtime handler (host responds to requests; viewer follows).
  const emitRef = useRef(emitState);
  const applyRef = useRef(applyState);
  useEffect(() => {
    emitRef.current = emitState;
    applyRef.current = applyState;
  });

  useEffect(() => {
    return onPlaybackMessage((msg) => {
      if ("request" in msg) {
        if (isHost) emitRef.current();
      } else if (!isHost) {
        applyRef.current(msg);
      }
    });
  }, [onPlaybackMessage, isHost]);

  // Host heartbeat: broadcast + persist position so everyone stays aligned.
  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (player && player.getPlayerState?.() === YT.PlayerState.PLAYING) {
        emitState();
        void persist({ position_seconds: player.getCurrentTime(), is_playing: true });
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [isHost, emitState, persist]);

  const value: PlaybackContextValue = {
    currentItem,
    isPlaying,
    playerReady,
    canControl: isHost,
    togglePlay,
    playItem,
    next,
    hasNext,
    countdownEndsAt,
    startCountdown,
    registerPlayer,
    handleStateChange,
    handlePlayerError,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}
