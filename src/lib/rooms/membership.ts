import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Add a verified user to a room as a participant (idempotent). Runs with the
 * service role so it doesn't depend on the per-request user token reaching
 * Postgres. The caller MUST pass an already-authenticated user id.
 */
export async function ensureMembership(roomId: string, userId: string, isHost: boolean) {
  const admin = createAdminClient();
  await admin.from("room_participants").upsert(
    { room_id: roomId, user_id: userId, role: isHost ? "host" : "viewer" },
    { onConflict: "room_id,user_id", ignoreDuplicates: true },
  );
}

/**
 * Make `userId` the host of a room (service role). Used for the demo room, whose
 * seeded host is never online — whoever joins should be able to control playback.
 */
export async function claimRoomHost(roomId: string, userId: string, previousHostId: string) {
  const admin = createAdminClient();
  if (previousHostId !== userId) {
    await admin
      .from("room_participants")
      .update({ role: "viewer" })
      .eq("room_id", roomId)
      .eq("user_id", previousHostId);
    await admin.from("rooms").update({ host_id: userId }).eq("id", roomId);
  }
  // Upsert (update on conflict) so the new host's role is set even if they were
  // already a participant.
  await admin
    .from("room_participants")
    .upsert({ room_id: roomId, user_id: userId, role: "host" }, { onConflict: "room_id,user_id" });
}
