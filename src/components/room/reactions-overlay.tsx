"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";

import { useRoom } from "@/components/room/room-provider";
import { EMOJI_CATEGORIES, MAIN_REACTIONS } from "@/lib/emojis";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Floater = { id: string; emoji: string; left: number };

/** Floating emoji reactions that rise over the video. */
export function ReactionsFloaters() {
  const { onBroadcast } = useRoom();
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const spawn = (emoji: string) => {
    const id = crypto.randomUUID();
    const left = 8 + Math.random() * 80;
    setFloaters((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 2800);
  };
  const spawnRef = useRef(spawn);
  useEffect(() => {
    spawnRef.current = spawn;
  });

  useEffect(
    () => onBroadcast("reaction", (payload) => spawnRef.current((payload as { emoji: string }).emoji)),
    [onBroadcast],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {floaters.map((f) => (
        <span
          key={f.id}
          className="animate-float-up absolute bottom-8 text-3xl drop-shadow"
          style={{ left: `${f.left}%` }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

/** Emoji picker bar — lives in the chat panel. Quick reactions + a "more" modal. */
export function ReactionBar() {
  const { sendReaction } = useRoom();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-center gap-1 border-t px-3 py-2">
      {MAIN_REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => sendReaction(e)}
          aria-label={`React ${e}`}
          className="rounded-full px-1.5 text-xl leading-none transition-transform hover:scale-125"
        >
          {e}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More reactions"
        className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <SmilePlus className="size-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reactions</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name} className="mb-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{cat.name}</p>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((e, i) => (
                    <button
                      key={`${e}-${i}`}
                      type="button"
                      onClick={() => {
                        sendReaction(e);
                        setOpen(false);
                      }}
                      aria-label={`React ${e}`}
                      className="rounded-md p-1 text-xl leading-none transition-transform hover:scale-125 hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
