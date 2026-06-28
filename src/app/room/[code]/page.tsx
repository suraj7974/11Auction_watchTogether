import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { normalizeRoomCode } from "@/lib/rooms/codes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

// NOTE: placeholder room shell — the full synced player + chat arrive in Checkpoint 5.
export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);

  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!room) notFound();

  // Joining by link = become a participant (idempotent).
  await supabase.from("room_participants").upsert(
    {
      room_id: room.id,
      user_id: profile.id,
      role: room.host_id === profile.id ? "host" : "viewer",
    },
    { onConflict: "room_id,user_id", ignoreDuplicates: true },
  );

  const isHost = room.host_id === profile.id;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="rounded-xl border p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{room.name}</h1>
          <Badge variant={isHost ? "default" : "secondary"}>{isHost ? "host" : "viewer"}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Room code: <span className="font-mono tracking-widest">{room.code}</span> ·{" "}
          {room.is_public ? "Public" : "Private"} · Status: {room.status}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-3xl">🎬</p>
          <p className="font-medium">You&apos;re in the room!</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The synced video player, chat, participants, and queue are being built next. For now,
            this confirms the room exists and you&apos;ve joined it.
          </p>
        </div>
      </div>

      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }), "self-start")}
      >
        Leave
      </Link>
    </main>
  );
}
