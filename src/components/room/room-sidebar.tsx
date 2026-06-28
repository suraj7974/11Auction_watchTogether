"use client";

import { ListVideo, MessageSquare, Users } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { ChatPanel } from "@/components/room/chat-panel";
import { QueuePanel } from "@/components/room/queue-panel";
import { ParticipantsPanel } from "@/components/room/participants-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RoomSidebar() {
  const { queue, participants } = useRoom();

  return (
    <Tabs defaultValue="chat" className="flex h-full flex-col gap-0">
      <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="chat" className="gap-1.5 rounded-none">
          <MessageSquare className="size-4" /> Chat
        </TabsTrigger>
        <TabsTrigger value="queue" className="gap-1.5 rounded-none">
          <ListVideo className="size-4" /> Queue
          {queue.length > 0 && <span className="text-xs text-muted-foreground">({queue.length})</span>}
        </TabsTrigger>
        <TabsTrigger value="people" className="gap-1.5 rounded-none">
          <Users className="size-4" /> People
          <span className="text-xs text-muted-foreground">({participants.length})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="min-h-0 flex-1">
        <ChatPanel />
      </TabsContent>
      <TabsContent value="queue" className="min-h-0 flex-1">
        <QueuePanel />
      </TabsContent>
      <TabsContent value="people" className="min-h-0 flex-1 overflow-y-auto">
        <ParticipantsPanel />
      </TabsContent>
    </Tabs>
  );
}
