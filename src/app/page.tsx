import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard, MessageSquare, Play, Smile, ListVideo, Timer, Users } from "lucide-react";

import { getCurrentProfile } from "@/lib/supabase/queries";
import { AppBackground } from "@/components/app-background";
import { buttonVariants } from "@/components/ui/button";

const FEATURES = [
  { icon: Play, title: "Synced playback", desc: "Play, pause, and seek stay in sync for everyone." },
  { icon: MessageSquare, title: "Live chat", desc: "React and talk in realtime while you watch." },
  { icon: Smile, title: "Emoji reactions", desc: "Float reactions over the video as it plays." },
  { icon: ListVideo, title: "Watch queue", desc: "Line up videos and auto-advance to the next." },
  { icon: Timer, title: "Start countdown", desc: "Press play together with a 3-2-1 countdown." },
  { icon: Users, title: "Presence", desc: "See who's in the room as people come and go." },
];

export default async function LandingPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <AppBackground />
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <Clapperboard className="size-5 text-primary" /> Watch Together
        </span>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
          <span className="rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            Watch YouTube together, in perfect sync
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Movie nights with friends, <span className="text-primary">no matter the distance</span>.
          </h1>
          <p className="max-w-xl text-lg font-medium text-foreground/80">
            Create a room, paste a YouTube link, and invite friends. Everyone watches together —
            play, pause, and seek stay synced, with live chat and reactions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create a watch party
            </Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Try the demo
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card/70 p-5 backdrop-blur-sm transition-colors hover:bg-card"
              >
                <f.icon className="mb-3 size-6 text-primary" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built for the 11auction assignment · Watch Together Platform
      </footer>
    </div>
  );
}
