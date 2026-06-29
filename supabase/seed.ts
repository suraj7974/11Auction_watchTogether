/**
 * Seed script — creates demo accounts and a ready-to-use demo watch room.
 *
 * Usage:  pnpm seed   (requires .env.local with NEXT_PUBLIC_SUPABASE_URL and
 *                      SUPABASE_SERVICE_ROLE_KEY, and the schema already applied)
 *
 * Idempotent: re-running re-creates the demo room from scratch and reuses the
 * existing demo users.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "eleven_auction" },
});

const DEMO_ROOM_CODE = "DEMO01";

const DEMO_USERS = [
  {
    email: "demo@watchtogether.app",
    password: "watchparty",
    display_name: "Demo Host",
  },
  {
    email: "friend@watchtogether.app",
    password: "watchparty",
    display_name: "Demo Friend",
  },
];

const DEMO_QUEUE = [
  {
    youtube_video_id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  },
  {
    youtube_video_id: "TLkA0RELQ1g",
    title: "Elephants Dream",
    url: "https://www.youtube.com/watch?v=TLkA0RELQ1g",
  },
];

/** Create the user if missing, otherwise reuse the existing one. Returns its id. */
async function ensureUser(
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (created.data.user) {
    console.log(`  + created user ${email}`);
    return created.data.user.id;
  }

  // Already exists — find it.
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const existing = data.users.find((u) => u.email === email);
  if (!existing)
    throw new Error(
      `Could not create or find user ${email}: ${created.error?.message}`,
    );
  console.log(`  = reusing user ${email}`);
  return existing.id;
}

async function main() {
  console.log("Seeding demo data…");

  // 1. Demo users (profiles are auto-created by the on_auth_user_created trigger).
  const userIds: string[] = [];
  for (const u of DEMO_USERS) {
    userIds.push(await ensureUser(u.email, u.password, u.display_name));
  }
  const [hostId] = userIds;

  // 2. Reset the demo room (cascade clears its queue/messages/participants).
  await admin.from("rooms").delete().eq("code", DEMO_ROOM_CODE);

  // 3. Create the demo room.
  const { data: room, error: roomErr } = await admin
    .from("rooms")
    .insert({
      code: DEMO_ROOM_CODE,
      name: "Demo Watch Party",
      host_id: hostId,
      is_public: true,
      status: "lobby",
    })
    .select()
    .single();
  if (roomErr) throw roomErr;
  console.log(`  + created room "${room.name}" (code ${room.code})`);

  // 4. Queue items.
  const { data: items, error: queueErr } = await admin
    .from("queue_items")
    .insert(
      DEMO_QUEUE.map((q, i) => ({
        ...q,
        room_id: room.id,
        position: i,
        added_by: hostId,
      })),
    )
    .select();
  if (queueErr) throw queueErr;
  console.log(`  + added ${items.length} queue items`);

  // 5. Point the room at the first queued video.
  await admin
    .from("rooms")
    .update({ current_item_id: items[0].id })
    .eq("id", room.id);

  // 6. Host joins as participant.
  await admin
    .from("room_participants")
    .insert({ room_id: room.id, user_id: hostId, role: "host" });

  // 7. Seed a couple of chat messages.
  await admin.from("messages").insert([
    {
      room_id: room.id,
      user_id: null,
      display_name: "System",
      content: "Welcome to the demo room! Press play to watch together.",
      type: "system",
    },
    {
      room_id: room.id,
      user_id: hostId,
      display_name: "Demo Host",
      content: "Hey! Queue is ready",
      type: "chat",
    },
  ]);
  console.log("  + seeded chat messages");

  console.log("\n✓ Seed complete.");
  console.log(`  Demo room link: /room/${DEMO_ROOM_CODE}`);
  console.log("  Demo logins (password: watchparty):");
  DEMO_USERS.forEach((u) => console.log(`    - ${u.email}`));
}

main().catch((err) => {
  console.error("\n✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
