"use client";

import { RoomProvider } from "@/components/room/room-provider";
import { PlaybackProvider } from "@/components/room/playback-provider";
import { PollProvider } from "@/components/room/poll-provider";
import { KnockManager } from "@/components/room/knock-manager";
import { RoomHeader } from "@/components/room/room-header";
import { RoomSidebar } from "@/components/room/room-sidebar";
import { VideoStage } from "@/components/room/video-stage";
import { HostControls } from "@/components/room/host-controls";
import type { CurrentUser, RoomBundle } from "@/types/room";

export function RoomView({
  bundle,
  currentUser,
  siteUrl,
}: {
  bundle: RoomBundle;
  currentUser: CurrentUser;
  siteUrl: string;
}) {
  return (
    <RoomProvider bundle={bundle} currentUser={currentUser}>
      <PlaybackProvider>
        <PollProvider>
          <KnockManager />
          <div className="flex h-[100dvh] flex-col bg-background/65">
            <RoomHeader siteUrl={siteUrl} />

            {/* Stacks on mobile (video on top, tabs fill the rest); row on desktop. */}
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <main className="min-w-0 shrink-0 p-3 md:flex-1 md:overflow-y-auto md:p-6">
                <div className="mx-auto max-w-4xl">
                  <VideoStage />
                  <HostControls />
                </div>
              </main>

              <aside className="flex min-h-0 flex-1 flex-col border-t border-border/50 bg-card/40 backdrop-blur-md md:flex-none md:w-[360px] md:border-t-0 md:border-l">
                <RoomSidebar />
              </aside>
            </div>
          </div>
        </PollProvider>
      </PlaybackProvider>
    </RoomProvider>
  );
}
