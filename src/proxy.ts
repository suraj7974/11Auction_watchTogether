import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy-session";

// Next.js 16: the `middleware` convention was renamed to `proxy` (Node.js runtime).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and image files, so auth redirects
     * never block CSS/JS/images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
