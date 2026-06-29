"use client";

import { useState } from "react";
import { Crown, Users } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ParticipantsPanel() {
  const { participants, currentUser, isHost, hostId, transferHost } = useRoom();
  const [busy, setBusy] = useState<string | null>(null);

  if (participants.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
        <Users className="size-8" />
        <p>No one here yet</p>
      </div>
    );
  }

  const makeHost = async (userId: string) => {
    setBusy(userId);
    await transferHost(userId);
    setBusy(null);
  };

  return (
    <ul className="flex flex-col gap-1 p-2">
      {participants.map((p) => {
        const isThisHost = p.userId === hostId;
        const canPromote = isHost && p.userId !== currentUser.id && !isThisHost;
        return (
          <li
            key={p.userId}
            className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <UserAvatar name={p.displayName} color={p.avatarColor} className="size-7" />
            <span className="flex-1 truncate text-sm font-medium">
              {p.displayName}
              {p.userId === currentUser.id && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>
              )}
            </span>

            {canPromote && (
              <Button
                size="xs"
                variant="outline"
                disabled={busy === p.userId}
                onClick={() => makeHost(p.userId)}
                // Always visible on mobile (no hover); hover-revealed on desktop.
                className="opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
              >
                {busy === p.userId ? "…" : "Make host"}
              </Button>
            )}

            {isThisHost && (
              <Badge variant="secondary" className="gap-1">
                <Crown className="size-3" /> Host
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
