import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getRoomBundle, getRoomByCode } from "@/lib/supabase/queries";
import { normalizeRoomCode } from "@/lib/rooms/codes";
import { RoomView } from "@/components/room/room-view";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);

  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const room = await getRoomByCode(code);
  if (!room) notFound();

  // Joining by link makes you a participant (idempotent), so you appear in the
  // people list and can read chat/queue under RLS.
  const supabase = await createClient();
  await supabase.from("room_participants").upsert(
    {
      room_id: room.id,
      user_id: profile.id,
      role: room.host_id === profile.id ? "host" : "viewer",
    },
    { onConflict: "room_id,user_id", ignoreDuplicates: true },
  );

  const bundle = await getRoomBundle(code);
  if (!bundle) notFound();

  return (
    <RoomView
      bundle={bundle}
      currentUser={{
        id: profile.id,
        displayName: profile.display_name,
        avatarColor: profile.avatar_color,
      }}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
    />
  );
}
