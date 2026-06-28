"use client";

import { useActionState } from "react";
import { CircleAlert, Plus } from "lucide-react";

import { createRoom, type RoomActionState } from "@/lib/rooms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: RoomActionState = {};

export function CreateRoomForm() {
  const [state, formAction, isPending] = useActionState(createRoom, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Room name</Label>
        <Input id="name" name="name" placeholder="Friday Movie Night" maxLength={60} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="is_public">Visibility</Label>
        <select
          id="is_public"
          name="is_public"
          defaultValue="true"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="true">Public — anyone with the link can join</option>
          <option value="false">Private — invite by code only</option>
        </select>
      </div>

      {state.error && (
        <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        <Plus className="size-4" />
        {isPending ? "Creating…" : "Create room"}
      </Button>
    </form>
  );
}
