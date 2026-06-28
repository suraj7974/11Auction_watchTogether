import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="max-w-sm text-muted-foreground">
        We couldn&apos;t find that page or room. The room code may be wrong, or the room may have
        been removed.
      </p>
      <Link href="/dashboard" className={buttonVariants()}>
        Back to dashboard
      </Link>
    </main>
  );
}
