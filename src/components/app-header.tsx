import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

/** Top bar for authenticated pages. */
export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <Clapperboard className="size-5 text-primary" />
          <span>Watch Together</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <UserAvatar name={profile.display_name} color={profile.avatar_color} />
            <span className="hidden text-sm font-medium sm:inline">{profile.display_name}</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
