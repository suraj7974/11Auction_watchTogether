"use client";

import { useState } from "react";
import { BarChart3, Plus, X } from "lucide-react";

import { usePoll } from "@/components/room/poll-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Host-only icon button + dialog to start a poll. */
export function CreatePollButton() {
  const { canManage, poll, createPoll } = usePoll();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  if (!canManage) return null;

  const validCount = options.filter((o) => o.trim()).length;
  const valid = question.trim().length > 0 && validCount >= 2;

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
  };

  const submit = () => {
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || opts.length < 2) return;
    createPoll(question.trim(), opts);
    setOpen(false);
    reset();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Create a poll"
        title="Create a poll"
      >
        <BarChart3 className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a poll</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="Ask a question…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={120}
              autoFocus
            />
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    maxLength={60}
                    onChange={(e) =>
                      setOptions((p) => p.map((o, idx) => (idx === i ? e.target.value : o)))
                    }
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove option"
                      onClick={() => setOptions((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setOptions((p) => [...p, ""])}
                >
                  <Plus className="size-4" /> Add option
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submit} disabled={!valid}>
              {poll && !poll.closed ? "Replace poll" : "Start poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
