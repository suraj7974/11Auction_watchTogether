import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clapperboard, LogIn, Play, Sparkles } from "lucide-react";

import { getCurrentProfile, getMyRooms } from "@/lib/supabase/queries";
import { joinDemoRoom } from "@/lib/rooms/actions";
import { AppHeader } from "@/components/app-header";
import { WelcomeIntro } from "@/components/welcome-intro";
import { CreateRoomForm } from "@/components/dashboard/create-room-form";
import { JoinRoomForm } from "@/components/dashboard/join-room-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;

  // The intro is rendered up front (server-decided), so it's painted with the
  // first frame and covers the data-fetch skeleton below — never the reverse.
  return (
    <>
      {welcome === "1" && <WelcomeIntro />}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody />
      </Suspense>
    </>
  );
}

async function DashboardBody() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const rooms = await getMyRooms();

  return (
    <>
      <AppHeader profile={profile} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Hey {profile.display_name}</h1>
          <p className="mt-1.5 text-muted-foreground">
            Create a room and drop a YouTube link, or join a friend with a code.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/60 bg-card/55 shadow-sm backdrop-blur-md transition hover:border-foreground/20 hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clapperboard className="size-5" />
                </span>
                <div className="space-y-0.5">
                  <CardTitle>Create a room</CardTitle>
                  <CardDescription>You&apos;ll be the host and control playback.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CreateRoomForm />
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/55 shadow-sm backdrop-blur-md transition hover:border-foreground/20 hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LogIn className="size-5" />
                </span>
                <div className="space-y-0.5">
                  <CardTitle>Join a room</CardTitle>
                  <CardDescription>Got a code from a friend? Enter it here.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <JoinRoomForm />
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="size-4 text-amber-500" />
                  <span>
                    New here? Try the <strong>demo room</strong>.
                  </span>
                </div>
                <form action={joinDemoRoom}>
                  <Button type="submit" size="sm" variant="outline">
                    Join demo
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Your rooms</h2>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card/40 py-16 text-center backdrop-blur-sm">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clapperboard className="size-6" />
              </span>
              <p className="font-medium">No rooms yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first room above, or join the demo to see how a watch party works.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map(({ room, role }) => (
                <Link key={room.id} href={`/room/${room.code}`} className="group">
                  <Card className="h-full border-border/60 bg-card/55 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Play className="size-4" />
                          </span>
                          <CardTitle className="truncate text-base">{room.name}</CardTitle>
                        </div>
                        <Badge variant={role === "host" ? "default" : "secondary"}>{role}</Badge>
                      </div>
                      <CardDescription className="pl-0.5 font-mono tracking-widest">
                        {room.code}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                        Enter room
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-8 h-5 w-80" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="mt-10 h-6 w-32" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </>
  );
}
