"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clapperboard, Copy, Crown, Users } from "lucide-react";
import { toast } from "sonner";

import { useRoom } from "@/components/room/room-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CONNECTION_LABEL = {
  connecting: { dot: "bg-amber-500", text: "Connecting…" },
  live: { dot: "bg-emerald-500", text: "Live" },
  reconnecting: { dot: "bg-amber-500 animate-pulse", text: "Reconnecting…" },
} as const;

export function RoomHeader({ siteUrl }: { siteUrl: string }) {
  const { room, participants, currentUser, isHost, transferHost, connection } = useRoom();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const status = CONNECTION_LABEL[connection];

  const others = participants.filter((p) => p.userId !== currentUser.id);

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

  function leave() {
    // Host with other people present → offer to hand off control first.
    if (isHost && others.length > 0) setLeaveOpen(true);
    else router.push("/dashboard");
  }

  async function handOffAndLeave(userId: string) {
    setBusy(userId);
    await transferHost(userId);
    router.push("/dashboard");
  }

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border/50 bg-background/50 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={leave}
          aria-label="Leave room"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <Clapperboard className="size-5 shrink-0 text-primary" />
          <h1 className="truncate font-semibold tracking-tight">{room.name}</h1>
        </div>
        <Badge variant="outline" className="hidden shrink-0 font-mono tracking-widest sm:inline-flex">
          {room.code}
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={`Realtime: ${status.text}`}
        >
          <span className={`size-2 rounded-full ${status.dot}`} />
          <span className="hidden sm:inline">{status.text}</span>
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="size-4" />
          {participants.length}
        </span>
        <Button variant="outline" size="sm" onClick={copyInvite}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span className="hidden sm:inline">Invite</span>
        </Button>
      </div>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer host before you leave?</DialogTitle>
            <DialogDescription>
              You&apos;re the host. Pick someone to take over, or leave without transferring (the
              room will have no host until someone is promoted).
            </DialogDescription>
          </DialogHeader>

          <ul className="-mx-1 max-h-64 overflow-y-auto">
            {others.map((p) => (
              <li key={p.userId} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                <UserAvatar name={p.displayName} color={p.avatarColor} className="size-7" />
                <span className="flex-1 truncate text-sm font-medium">{p.displayName}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => handOffAndLeave(p.userId)}
                  className="gap-1"
                >
                  <Crown className={cn("size-3.5", busy === p.userId && "animate-pulse")} />
                  Make host & leave
                </Button>
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button
              variant="ghost"
              disabled={busy !== null}
              onClick={() => router.push("/dashboard")}
            >
              Leave without transferring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
