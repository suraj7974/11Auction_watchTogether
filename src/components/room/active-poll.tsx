"use client";

import { BarChart3, Check } from "lucide-react";

import { usePoll } from "@/components/room/poll-provider";
import { cn } from "@/lib/utils";

/** The pinned active-poll card shown at the top of chat. */
export function ActivePoll() {
  const { poll, counts, totalVotes, myVote, canManage, vote, closePoll } = usePoll();
  if (!poll) return null;

  return (
    <div className="m-3 rounded-xl border bg-card/80 p-3 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4 shrink-0 text-primary" />
          <span>{poll.question}</span>
        </div>
        {canManage && !poll.closed && (
          <button
            type="button"
            onClick={closePoll}
            className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            End
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {poll.options.map((opt, i) => {
          const c = counts[i] ?? 0;
          const pct = totalVotes ? Math.round((c / totalVotes) * 100) : 0;
          const mine = myVote === i;
          return (
            <button
              key={i}
              type="button"
              disabled={poll.closed}
              onClick={() => vote(i)}
              className={cn(
                "relative overflow-hidden rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                mine ? "border-primary" : "border-border",
                !poll.closed && !mine && "hover:bg-muted",
                poll.closed && "cursor-default",
              )}
            >
              <span
                className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  {mine && <Check className="size-3.5 text-primary" />}
                  {opt}
                </span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        {poll.closed && " · ended"}
      </p>
    </div>
  );
}
