import { getCurrentProfile } from "@/lib/supabase/queries";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Minimal authenticated home — the full landing/dashboard arrives in Checkpoint 4.
export default async function Home() {
  const profile = await getCurrentProfile();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-4xl">🎬</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{profile ? `, ${profile.display_name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          You&apos;re signed in. The dashboard and watch rooms are coming next.
        </p>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
