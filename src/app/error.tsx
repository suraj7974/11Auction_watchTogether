"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlert className="size-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        An unexpected error occurred. You can try again, and if it keeps happening, head back to the
        dashboard.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
