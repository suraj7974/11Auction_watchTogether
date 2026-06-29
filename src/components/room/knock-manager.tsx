"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useRoom } from "@/components/room/room-provider";
import { admitToRoom } from "@/lib/rooms/actions";

/** Host-only: listens for join requests on private rooms and shows admit/deny. */
export function KnockManager() {
  const { isHost, onBroadcast, broadcast, room } = useRoom();
  const handled = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isHost) return;
    return onBroadcast("knock", (payload) => {
      const k = payload as { userId?: string; displayName?: string };
      if (!k?.userId || handled.current.has(k.userId)) return;

      toast(`${k.displayName ?? "Someone"} wants to join`, {
        id: `knock-${k.userId}`,
        duration: Infinity,
        action: {
          label: "Admit",
          onClick: () => {
            handled.current.add(k.userId!);
            void admitToRoom(room.code, k.userId!).then(() =>
              broadcast("admit", { userId: k.userId }),
            );
          },
        },
        cancel: {
          label: "Deny",
          onClick: () => {
            handled.current.add(k.userId!);
            broadcast("deny", { userId: k.userId });
          },
        },
      });
    });
  }, [isHost, onBroadcast, broadcast, room.code]);

  return null;
}
