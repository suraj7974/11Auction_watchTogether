import Link from "next/link";
import { Clapperboard } from "lucide-react";

import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

/** Top bar for authenticated pages. */
export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/55 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clapperboard className="size-4" />
          </span>
          <span>Watch Together</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/40 py-1 pr-3 pl-1">
            <UserAvatar name={profile.display_name} color={profile.avatar_color} className="size-7" />
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
