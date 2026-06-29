import { notFound } from "next/navigation";

import { getCurrentProfile, getRoomBundle, getRoomByCode } from "@/lib/supabase/queries";
import { ensureMembership, isRoomMember } from "@/lib/rooms/membership";
import { normalizeRoomCode } from "@/lib/rooms/codes";
import { RoomView } from "@/components/room/room-view";
import { WaitingRoom } from "@/components/room/waiting-room";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);

  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const room = await getRoomByCode(code);
  if (!room) notFound();

  const isHost = room.host_id === profile.id;
  const member = isHost || (await isRoomMember(room.id, profile.id));

  // Private rooms aren't joinable from the link alone — the host must admit you.
  if (!room.is_public && !member) {
    return (
      <WaitingRoom
        roomId={room.id}
        roomName={room.name}
        currentUser={{
          userId: profile.id,
          displayName: profile.display_name,
          avatarColor: profile.avatar_color,
        }}
      />
    );
  }

  // Public rooms auto-join; for private members/host this is idempotent.
  await ensureMembership(room.id, profile.id, isHost);

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
