import "server-only";

import { createClient } from "@supabase/supabase-js";

import { DB_SCHEMA, type Database } from "@/types/database";

/**
 * Service-role Supabase client. SERVER-ONLY — bypasses RLS, so never import this
 * into client components. Used for privileged writes we fully control on the
 * server (e.g. adding a verified user as a room participant), where relying on
 * the per-request user token for the write is unreliable.
 */
export function createAdminClient() {
  return createClient<Database, "eleven_auction">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: DB_SCHEMA },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
