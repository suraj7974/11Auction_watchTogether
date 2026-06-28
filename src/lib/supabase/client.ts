import { createBrowserClient } from "@supabase/ssr";

import { DB_SCHEMA, type Database } from "@/types/database";

/**
 * Supabase client for use in Client Components (browser).
 * Scoped to the `eleven_auction` schema.
 */
export function createClient() {
  return createBrowserClient<Database, "eleven_auction">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } },
  );
}
