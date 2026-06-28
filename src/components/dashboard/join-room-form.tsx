"use client";

import { useActionState } from "react";
import { CircleAlert, LogIn } from "lucide-react";

import { joinRoom, type RoomActionState } from "@/lib/rooms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: RoomActionState = {};

export function JoinRoomForm() {
  const [state, formAction, isPending] = useActionState(joinRoom, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Room code</Label>
        <Input
          id="code"
          name="code"
          placeholder="ABC123"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase tracking-widest placeholder:tracking-normal"
          required
        />
      </div>

      {state.error && (
        <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Button type="submit" variant="secondary" disabled={isPending}>
        <LogIn className="size-4" />
        {isPending ? "Joining…" : "Join room"}
      </Button>
    </form>
  );
}
