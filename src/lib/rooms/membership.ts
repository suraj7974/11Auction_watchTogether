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
