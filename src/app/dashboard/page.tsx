import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clapperboard, Sparkles } from "lucide-react";

import { getCurrentProfile, getMyRooms } from "@/lib/supabase/queries";
import { joinDemoRoom } from "@/lib/rooms/actions";
import { AppHeader } from "@/components/app-header";
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

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const rooms = await getMyRooms();

  return (
    <>
      <AppHeader profile={profile} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hey {profile.display_name}
          </h1>
          <p className="text-muted-foreground">
            Create a room and drop a YouTube link, or join a friend with a code.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clapperboard className="size-5" /> Create a room
              </CardTitle>
              <CardDescription>You&apos;ll be the host and control playback.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateRoomForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="size-5" /> Join a room
              </CardTitle>
              <CardDescription>Got a code from a friend? Enter it here.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <JoinRoomForm />
              <div className="rounded-lg border border-dashed p-3">
                <div className="flex items-center justify-between gap-3">
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
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Your rooms</h2>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
              <Clapperboard className="size-8 text-muted-foreground" />
              <p className="font-medium">No rooms yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first room above, or join the demo to see how a watch party works.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map(({ room, role }) => (
                <Link key={room.id} href={`/room/${room.code}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-foreground/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{room.name}</CardTitle>
                        <Badge variant={role === "host" ? "default" : "secondary"}>{role}</Badge>
                      </div>
                      <CardDescription className="font-mono tracking-widest">
                        {room.code}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                        Enter room <ArrowRight className="size-4" />
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
