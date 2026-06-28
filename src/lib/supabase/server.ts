import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { DB_SCHEMA, type Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. `cookies()` is async in Next.js 16, so this factory is async too.
 * Scoped to the `eleven_auction` schema.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database, "eleven_auction">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: DB_SCHEMA },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Components, setting cookies throws — the proxy refreshes
          // the session, so it's safe to ignore here.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
