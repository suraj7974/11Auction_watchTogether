"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { parseYouTubeId, youTubeWatchUrl } from "@/lib/youtube";
import type { Message, QueueItem, Room } from "@/types/database";
import type { CurrentUser, ParticipantView, RoomBundle } from "@/types/room";

type RoomContextValue = {
  room: Room;
  currentUser: CurrentUser;
  isHost: boolean;
  messages: Message[];
  queue: QueueItem[];
  participants: ParticipantView[];
  sendMessage: (content: string) => Promise<void>;
  addToQueue: (url: string) => Promise<boolean>;
  removeFromQueue: (id: string) => Promise<void>;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}

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
  const [messages, setMessages] = useState<Message[]>(bundle.messages);
  const [queue, setQueue] = useState<QueueItem[]>(bundle.queue);
  const [participants] = useState<ParticipantView[]>(bundle.participants);

  const { room } = bundle;
  const isHost = room.host_id === currentUser.id;

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

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error("Couldn't send message", { description: error.message });
        return;
      }
      // Swap the optimistic row for the persisted one (keeps a real id).
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    },
    [supabase, room.id, currentUser],
  );

  const addToQueue = useCallback(
    async (url: string) => {
      const videoId = parseYouTubeId(url);
      if (!videoId) {
        toast.error("That doesn't look like a YouTube link");
        return false;
      }

      const tempId = `temp-${crypto.randomUUID()}`;
      const watchUrl = youTubeWatchUrl(videoId);
      const optimistic: QueueItem = {
        id: tempId,
        room_id: room.id,
        youtube_video_id: videoId,
        title: null,
        url: watchUrl,
        position: queue.length,
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
          position: queue.length,
          added_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        setQueue((prev) => prev.filter((q) => q.id !== tempId));
        toast.error("Couldn't add to queue", { description: error.message });
        return false;
      }
      setQueue((prev) => prev.map((q) => (q.id === tempId ? data : q)));
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
        setQueue((prev) =>
          [...prev, removed].sort((a, b) => a.position - b.position),
        );
        toast.error("Couldn't remove from queue", { description: error.message });
      }
    },
    [supabase, queue],
  );

  const value: RoomContextValue = {
    room,
    currentUser,
    isHost,
    messages,
    queue,
    participants,
    sendMessage,
    addToQueue,
    removeFromQueue,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
