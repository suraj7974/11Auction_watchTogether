import { notFound } from "next/navigation";

import { getCurrentProfile, getRoomBundle, getRoomByCode } from "@/lib/supabase/queries";
import { ensureMembership } from "@/lib/rooms/membership";
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
  await ensureMembership(room.id, profile.id, room.host_id === profile.id);

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
