import { cn } from "../utils/index";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  );
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

export function AIConfigSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Configuration Card */}
      <div className="border rounded-lg">
        {/* Card Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="border-t pt-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function AIConfigFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      {/* Form Card */}
      <div className="border rounded-lg">
        {/* Card Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-3 w-48" />
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIConfigEmptySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Empty State */}
      <div className="text-center py-8 border rounded-lg border-dashed">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
          <Skeleton className="h-10 w-36 mx-auto rounded-lg mt-4" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton };
