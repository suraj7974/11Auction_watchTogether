"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Guest = { userId: string; displayName: string; avatarColor: string };

/** Shown when a non-member opens a private room — knocks and waits for the host. */
export function WaitingRoom({
  roomId,
  roomName,
  currentUser,
}: {
  roomId: string;
  roomName: string;
  currentUser: Guest;
}) {
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, { config: { broadcast: { self: false } } });
    const knock = () =>
      void channel.send({ type: "broadcast", event: "knock", payload: currentUser });

    channel
      .on("broadcast", { event: "admit" }, ({ payload }) => {
        if ((payload as { userId: string }).userId === currentUser.userId) window.location.reload();
      })
      .on("broadcast", { event: "deny" }, ({ payload }) => {
        if ((payload as { userId: string }).userId === currentUser.userId) setDenied(true);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") knock();
      });

    // Re-knock periodically in case the host joined after us.
    const id = setInterval(knock, 5000);
    return () => {
      clearInterval(id);
      void supabase.removeChannel(channel);
    };
  }, [roomId, currentUser]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="size-6" />
        </div>

        {denied ? (
          <>
            <h1 className="text-lg font-semibold">Request declined</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The host didn&apos;t let you into &ldquo;{roomName}&rdquo;.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Waiting to be let in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{roomName}&rdquo; is private — the host has been asked to admit you.
            </p>
            <Loader2 className="mx-auto mt-4 size-5 animate-spin text-muted-foreground" />
          </>
        )}

        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full")}
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
