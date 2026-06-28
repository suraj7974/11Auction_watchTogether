"use client";

import { RoomProvider } from "@/components/room/room-provider";
import { PlaybackProvider } from "@/components/room/playback-provider";
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
        <div className="flex h-[100dvh] flex-col">
          <RoomHeader siteUrl={siteUrl} />

          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="mx-auto max-w-4xl">
                <VideoStage />
                <HostControls />
              </div>
            </main>

            <aside className="hidden w-[360px] shrink-0 border-l md:flex md:flex-col">
              <RoomSidebar />
            </aside>
          </div>
        </div>
      </PlaybackProvider>
    </RoomProvider>
  );
}
