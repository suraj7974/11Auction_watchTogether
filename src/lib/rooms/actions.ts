"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { generateRoomCode, normalizeRoomCode } from "@/lib/rooms/codes";

export type RoomActionState = { error?: string };

/** Create a room, join it as host, and enter it. */
export async function createRoom(
  _prev: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const isPublic = formData.get("is_public") !== "false";

  if (!name) return { error: "Give your room a name." };
  if (name.length > 60) return { error: "Room name is too long (max 60 chars)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Retry a few times in the unlikely event of a code collision.
  let createdCode: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({ code, name, host_id: user.id, is_public: isPublic })
      .select("id, code")
      .single();

    if (!error && data) {
      await supabase
        .from("room_participants")
        .insert({ room_id: data.id, user_id: user.id, role: "host" });
      createdCode = data.code;
      break;
    }
    if (error?.code === "23505") continue; // unique violation → new code
    return { error: error?.message ?? "Could not create the room." };
  }

  if (!createdCode) return { error: "Could not generate a unique room code. Try again." };
  redirect(`/room/${createdCode}`);
}

/** Shared join logic: ensure a participant row exists, then enter the room. */
async function joinByCode(code: string): Promise<RoomActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_id")
    .eq("code", code)
    .maybeSingle();
  if (!room) return { error: `No room found with code "${code}".` };

  const { error } = await supabase.from("room_participants").upsert(
    {
      room_id: room.id,
      user_id: user.id,
      role: room.host_id === user.id ? "host" : "viewer",
    },
    { onConflict: "room_id,user_id", ignoreDuplicates: true },
  );
  if (error) return { error: error.message };

  redirect(`/room/${room.code}`);
}

/** Join a room by user-entered code. */
export async function joinRoom(
  _prev: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  const code = normalizeRoomCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "Enter a room code." };
  return joinByCode(code);
}

/** One-click join of the seeded demo room. */
export async function joinDemoRoom() {
  await joinByCode("DEMO01");
}
