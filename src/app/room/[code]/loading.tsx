import { Skeleton } from "@/components/ui/skeleton";

export default function RoomLoading() {
  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-4xl space-y-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-6 w-72" />
          </div>
        </main>
        <aside className="hidden w-[360px] shrink-0 border-l md:block">
          <Skeleton className="m-0 h-10 w-full rounded-none" />
          <div className="space-y-3 p-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-5/6" />
          </div>
        </aside>
      </div>
    </div>
  );
}
