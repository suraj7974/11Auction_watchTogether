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
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { parseYouTubeId, youTubeWatchUrl } from "@/lib/youtube";
import type { Message, QueueItem, Room } from "@/types/database";
import type { CurrentUser, ParticipantView, RoomBundle } from "@/types/room";

/** Playback state broadcast by the host and applied by viewers. */
export type PlaybackBroadcast = {
  currentItemId: string | null;
  videoId: string | null;
  positionSeconds: number;
  isPlaying: boolean;
  emittedAt: number;
};

type PlaybackHandler = (msg: PlaybackBroadcast | { request: true }) => void;

type RoomContextValue = {
  room: Room;
  currentUser: CurrentUser;
  isHost: boolean;
  messages: Message[];
  queue: QueueItem[];
  participants: ParticipantView[];
  connection: "connecting" | "live" | "reconnecting";
  sendMessage: (content: string) => Promise<void>;
  addToQueue: (url: string) => Promise<boolean>;
  removeFromQueue: (id: string) => Promise<void>;
  // Realtime wiring used by the PlaybackProvider:
  broadcastPlayback: (state: PlaybackBroadcast) => void;
  requestSync: () => void;
  onPlaybackMessage: (handler: PlaybackHandler) => () => void;
  // Generic broadcast (reactions, countdown):
  broadcast: (event: string, payload: unknown) => void;
  onBroadcast: (event: string, handler: (payload: unknown) => void) => () => void;
  // Emoji reactions (broadcast to others + show locally):
  sendReaction: (emoji: string) => void;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}

type PresenceMeta = {
  userId: string;
  displayName: string;
  avatarColor: string;
  role: "host" | "viewer";
};

export function RoomProvider({
  bundle,
  currentUser,
  children,
}: {
  bundle: RoomBundle;
  currentUser: CurrentUser;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { room } = bundle;
  const isHost = room.host_id === currentUser.id;

  const [messages, setMessages] = useState<Message[]>(bundle.messages);
  const [queue, setQueue] = useState<QueueItem[]>(bundle.queue);
  const [participants, setParticipants] = useState<ParticipantView[]>(bundle.participants);
  const [connection, setConnection] = useState<"connecting" | "live" | "reconnecting">("connecting");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const playbackHandlers = useRef<Set<PlaybackHandler>>(new Set());
  const broadcastHandlers = useRef<Map<string, Set<(payload: unknown) => void>>>(new Map());

  // --- realtime channel: presence + broadcast (chat, queue, playback) ---------
  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`, {
      config: { presence: { key: currentUser.id }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    const syncPresence = () => {
      const state = channel.presenceState<PresenceMeta>();
      const byUser = new Map<string, ParticipantView>();
      // Always include yourself, so the list is never empty.
      byUser.set(currentUser.id, {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        avatarColor: currentUser.avatarColor,
        role: isHost ? "host" : "viewer",
      });
      Object.values(state)
        .flat()
        .forEach((p) => {
          byUser.set(p.userId, {
            userId: p.userId,
            displayName: p.displayName,
            avatarColor: p.avatarColor,
            role: p.role,
          });
        });
      // Host always shown first.
      const list = [...byUser.values()].sort((a, b) =>
        a.role === b.role ? a.displayName.localeCompare(b.displayName) : a.role === "host" ? -1 : 1,
      );
      setParticipants(list);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("broadcast", { event: "chat" }, ({ payload }) => {
        const m = payload as Message;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .on("broadcast", { event: "queue_add" }, ({ payload }) => {
        const item = payload as QueueItem;
        setQueue((prev) =>
          prev.some((q) => q.id === item.id)
            ? prev
            : [...prev, item].sort((a, b) => a.position - b.position),
        );
      })
      .on("broadcast", { event: "queue_remove" }, ({ payload }) => {
        const id = (payload as { id: string }).id;
        setQueue((prev) => prev.filter((q) => q.id !== id));
      })
      .on("broadcast", { event: "pb" }, ({ payload }) => {
        playbackHandlers.current.forEach((h) => h(payload as PlaybackBroadcast));
      })
      .on("broadcast", { event: "req" }, () => {
        playbackHandlers.current.forEach((h) => h({ request: true }));
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        broadcastHandlers.current.get("reaction")?.forEach((h) => h(payload));
      })
      .on("broadcast", { event: "countdown" }, ({ payload }) => {
        broadcastHandlers.current.get("countdown")?.forEach((h) => h(payload));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("live");
          // Runs again on every (re)subscribe, so reconnects re-track + re-sync.
          void channel.track({
            userId: currentUser.id,
            displayName: currentUser.displayName,
            avatarColor: currentUser.avatarColor,
            role: isHost ? "host" : "viewer",
          } satisfies PresenceMeta);
          // Ask the host for the current playback state (late-joiner sync).
          void channel.send({ type: "broadcast", event: "req", payload: {} });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnection("reconnecting");
        }
      });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase, room.id, currentUser, isHost]);

  // --- chat -------------------------------------------------------------------
  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content) return;

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: Message = {
        id: tempId,
        room_id: room.id,
        user_id: currentUser.id,
        display_name: currentUser.displayName,
        content,
        type: "chat",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          room_id: room.id,
          user_id: currentUser.id,
          display_name: currentUser.displayName,
          content,
          type: "chat",
        })
        .select()
        .single();

      if (error || !data) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Couldn't send message", { description: error?.message });
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      void channelRef.current?.send({ type: "broadcast", event: "chat", payload: data });
    },
    [supabase, room.id, currentUser],
  );

  // --- queue ------------------------------------------------------------------
  const addToQueue = useCallback(
    async (url: string) => {
      const videoId = parseYouTubeId(url);
      if (!videoId) {
        toast.error("That doesn't look like a YouTube link");
        return false;
      }

      const tempId = `temp-${crypto.randomUUID()}`;
      const watchUrl = youTubeWatchUrl(videoId);
      const position = queue.length;
      const optimistic: QueueItem = {
        id: tempId,
        room_id: room.id,
        youtube_video_id: videoId,
        title: null,
        url: watchUrl,
        position,
        added_by: currentUser.id,
        played: false,
        created_at: new Date().toISOString(),
      };
      setQueue((prev) => [...prev, optimistic]);

      const { data, error } = await supabase
        .from("queue_items")
        .insert({
          room_id: room.id,
          youtube_video_id: videoId,
          url: watchUrl,
          position,
          added_by: currentUser.id,
        })
        .select()
        .single();

      if (error || !data) {
        setQueue((prev) => prev.filter((q) => q.id !== tempId));
        toast.error("Couldn't add to queue", { description: error?.message });
        return false;
      }
      setQueue((prev) => prev.map((q) => (q.id === tempId ? data : q)));
      void channelRef.current?.send({ type: "broadcast", event: "queue_add", payload: data });
      return true;
    },
    [supabase, room.id, queue.length, currentUser.id],
  );

  const removeFromQueue = useCallback(
    async (id: string) => {
      const removed = queue.find((q) => q.id === id);
      setQueue((prev) => prev.filter((q) => q.id !== id));

      const { error } = await supabase.from("queue_items").delete().eq("id", id);
      if (error && removed) {
        setQueue((prev) => [...prev, removed].sort((a, b) => a.position - b.position));
        toast.error("Couldn't remove from queue", { description: error.message });
        return;
      }
      void channelRef.current?.send({ type: "broadcast", event: "queue_remove", payload: { id } });
    },
    [supabase, queue],
  );

  // --- playback wiring (used by PlaybackProvider) -----------------------------
  const broadcastPlayback = useCallback((state: PlaybackBroadcast) => {
    void channelRef.current?.send({ type: "broadcast", event: "pb", payload: state });
  }, []);

  const requestSync = useCallback(() => {
    void channelRef.current?.send({ type: "broadcast", event: "req", payload: {} });
  }, []);

  const onPlaybackMessage = useCallback((handler: PlaybackHandler) => {
    playbackHandlers.current.add(handler);
    return () => {
      playbackHandlers.current.delete(handler);
    };
  }, []);

  const broadcast = useCallback((event: string, payload: unknown) => {
    void channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const onBroadcast = useCallback((event: string, handler: (payload: unknown) => void) => {
    const set = broadcastHandlers.current.get(event) ?? new Set();
    set.add(handler);
    broadcastHandlers.current.set(event, set);
    return () => set.delete(handler);
  }, []);

  // Broadcast a reaction to others and dispatch it locally so the sender sees it too.
  const sendReaction = useCallback(
    (emoji: string) => {
      broadcast("reaction", { emoji });
      broadcastHandlers.current.get("reaction")?.forEach((h) => h({ emoji }));
    },
    [broadcast],
  );

  const value: RoomContextValue = {
    room,
    currentUser,
    isHost,
    messages,
    queue,
    participants,
    connection,
    sendMessage,
    addToQueue,
    removeFromQueue,
    broadcastPlayback,
    requestSync,
    onPlaybackMessage,
    broadcast,
    onBroadcast,
    sendReaction,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
