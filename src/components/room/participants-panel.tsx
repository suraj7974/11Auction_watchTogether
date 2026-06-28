"use client";

import { Crown } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";

export function ParticipantsPanel() {
  const { participants, currentUser } = useRoom();

  if (participants.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
        <span className="text-2xl">👀</span>
        <p>No one here yet</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-2">
      {participants.map((p) => (
        <li key={p.userId} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted">
          <UserAvatar name={p.displayName} color={p.avatarColor} className="size-7" />
          <span className="flex-1 truncate text-sm font-medium">
            {p.displayName}
            {p.userId === currentUser.id && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>
            )}
          </span>
          {p.role === "host" && (
            <Badge variant="secondary" className="gap-1">
              <Crown className="size-3" /> Host
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
