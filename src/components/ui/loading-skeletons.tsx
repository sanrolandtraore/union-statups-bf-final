import { Skeleton } from "@/components/ui/skeleton";

/** Full-page skeleton used as Suspense fallback for route-level lazy loads. */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="h-16 border-b border-border bg-card/50">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        <Skeleton className="h-8 w-32" />
        <div className="hidden gap-4 md:flex">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
    <div className="container mx-auto max-w-6xl px-4 pt-10">
      <Skeleton className="mb-4 h-10 w-2/3 md:w-1/2" />
      <Skeleton className="mb-8 h-5 w-full max-w-md" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

/** Skeleton for content area inside the dashboard (sidebar already rendered). */
export const TabSkeleton = () => (
  <div className="space-y-6 p-2">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <Skeleton className="mb-3 h-32 w-full rounded-lg" />
    <Skeleton className="mb-2 h-5 w-3/4" />
    <Skeleton className="mb-4 h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const AuthGuardSkeleton = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="w-full max-w-sm space-y-4 p-6">
      <Skeleton className="mx-auto h-12 w-12 rounded-full" />
      <Skeleton className="mx-auto h-4 w-32" />
      <Skeleton className="mx-auto h-3 w-24" />
    </div>
  </div>
);
