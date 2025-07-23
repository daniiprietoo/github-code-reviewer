import { cn } from "../utils/index"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export function PullRequestSkeleton() {
  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-primary/20 bg-card p-4 sm:gap-0 gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Skeleton className="h-12 w-12 rounded-lg border border-primary/10 flex-shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}

export function RepositorySkeleton() {
  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-primary/20 bg-card p-4 sm:gap-0 gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Skeleton className="h-12 w-12 rounded-lg border border-primary/10 flex-shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}

export function PullRequestListSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-48 mb-4" />
      <div className="flex flex-col gap-4">
        {[1, 2].map((id) => (
          <PullRequestSkeleton key={`pr-skeleton-${id}`} />
        ))}
      </div>
    </div>
  );
}

export function RepositoryListSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-80 mb-4" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((id) => (
          <RepositorySkeleton key={`repo-skeleton-${id}`} />
        ))}
      </div>
    </div>
  );
}

export { Skeleton }
