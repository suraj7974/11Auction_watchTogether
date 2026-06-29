"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Clapperboard, Copy, Users } from "lucide-react";
import { toast } from "sonner";

import { useRoom } from "@/components/room/room-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

const CONNECTION_LABEL = {
  connecting: { dot: "bg-amber-500", text: "Connecting…" },
  live: { dot: "bg-emerald-500", text: "Live" },
  reconnecting: { dot: "bg-amber-500 animate-pulse", text: "Reconnecting…" },
} as const;

export function RoomHeader({ siteUrl }: { siteUrl: string }) {
  const { room, participants, connection } = useRoom();
  const [copied, setCopied] = useState(false);
  const status = CONNECTION_LABEL[connection];

  async function copyInvite() {
    const link = `${siteUrl}/room/${room.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied", { description: link });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — your room code is " + room.code);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border/50 bg-background/50 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Back to dashboard"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Clapperboard className="size-5 text-primary" />
          <h1 className="font-semibold tracking-tight">{room.name}</h1>
        </div>
        <Badge variant="outline" className="font-mono tracking-widest">
          {room.code}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={`Realtime: ${status.text}`}
        >
          <span className={`size-2 rounded-full ${status.dot}`} />
          {status.text}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="size-4" />
          {participants.length}
        </span>
        <Button variant="outline" size="sm" onClick={copyInvite}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          Invite
        </Button>
      </div>
    </header>
  );
}
