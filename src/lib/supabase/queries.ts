import { createClient } from "@/lib/supabase/server";
import type { ParticipantRole, Profile, Room } from "@/types/database";
import type { ParticipantView, RoomBundle } from "@/types/room";

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

  const { data: parts, error: partsErr } = await supabase
    .from("room_participants")
    .select("room_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  // A real failure should surface as an error state, not an empty list.
  if (partsErr) throw new Error(`Failed to load your rooms: ${partsErr.message}`);
  if (!parts?.length) return [];

  const { data: rooms, error: roomsErr } = await supabase
    .from("rooms")
    .select("*")
    .in(
      "id",
      parts.map((p) => p.room_id),
    );
  if (roomsErr) throw new Error(`Failed to load your rooms: ${roomsErr.message}`);

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

/** Load everything needed to render a room: room, queue, messages, participants. */
export async function getRoomBundle(code: string): Promise<RoomBundle | null> {
  const supabase = await createClient();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (roomErr) throw new Error(`Failed to load the room: ${roomErr.message}`);
  if (!room) return null;

  const [{ data: queue }, { data: messages }, { data: parts }] = await Promise.all([
    supabase.from("queue_items").select("*").eq("room_id", room.id).order("position"),
    supabase
      .from("messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at")
      .limit(200),
    supabase.from("room_participants").select("user_id, role").eq("room_id", room.id),
  ]);

  // Join participants to their profiles for display.
  let participants: ParticipantView[] = [];
  if (parts?.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_color")
      .in(
        "id",
        parts.map((p) => p.user_id),
      );
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    participants = parts
      .map((p) => {
        const profile = byId.get(p.user_id);
        if (!profile) return null;
        return {
          userId: p.user_id,
          displayName: profile.display_name,
          avatarColor: profile.avatar_color,
          role: p.role as ParticipantRole,
        } satisfies ParticipantView;
      })
      .filter((p): p is ParticipantView => p !== null);
  }

  return { room, queue: queue ?? [], messages: messages ?? [], participants };
}
