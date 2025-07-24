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
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-4 transition-all hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0 mt-0.5" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28 hidden sm:block" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
      </div>
    </div>
  );
}

export function RepositorySkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-6 transition-all hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md">
      {/* Repository Icon and Actions */}
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>

      {/* Repository Info */}
      <div className="mb-3">
        <Skeleton className="h-6 w-40 mb-1" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Repository Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PullRequestListSkeleton() {
  return (
    <div>
      <div className="space-y-3">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
