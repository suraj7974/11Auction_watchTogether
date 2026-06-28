import { createClient } from "@/lib/supabase/server";
import type { ParticipantRole, Profile, Room } from "@/types/database";

/** The signed-in user's profile, or null if not authenticated. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

export type MyRoom = { room: Room; role: ParticipantRole };

/** Rooms the current user hosts or has joined, newest first. */
export async function getMyRooms(): Promise<MyRoom[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: parts } = await supabase
    .from("room_participants")
    .select("room_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (!parts?.length) return [];

  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .in(
      "id",
      parts.map((p) => p.room_id),
    );

  const byId = new Map((rooms ?? []).map((r) => [r.id, r]));
  return parts
    .filter((p) => byId.has(p.room_id))
    .map((p) => ({ room: byId.get(p.room_id)!, role: p.role as ParticipantRole }));
}

/** Fetch a single room by its join code. */
export async function getRoomByCode(code: string): Promise<Room | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
  return data ?? null;
}
