"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import type { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { PullRequestListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  GitPullRequest,
  MessageCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function PullRequestList({
  preloadedPullRequests,
}: {
  preloadedPullRequests: Preloaded<
    typeof api.pullrequests.getRecentPullRequests
  >;
}) {
  const pullRequests = usePreloadedQuery(preloadedPullRequests);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "analyzing":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const emptyState = (
    <div>
      <h2 className="text-xl font-semibold text-primary mb-4">
        No pull requests found
      </h2>
    </div>
  );

  return (
    <LoadingWrapper
      isLoading={pullRequests === undefined}
      loadingComponent={<PullRequestListSkeleton />}
      fallback={pullRequests?.length === 0 ? emptyState : null}
    >
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4">
          Recent Pull Requests
        </h2>
        <div className="flex flex-col gap-4">
          {pullRequests?.map((pr) => (
            <div
              key={pr._id}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-primary/20 bg-card p-4 sm:gap-0 gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/10 bg-secondary flex-shrink-0">
                  <GitPullRequest className="h-6 w-6 stroke-[2px] text-primary/60" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-primary truncate">
                      #{pr.number} {pr.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(pr.status)}
                      <span className="text-xs font-medium text-primary/80 capitalize">
                        {pr.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-primary/60">
                    <span className="font-mono truncate">
                      {pr.repository?.fullName}
                    </span>
                    <span>by @{pr.author}</span>
                    <span>
                      {pr.headRef} → {pr.baseRef}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                    {pr.codeReviews && pr.codeReviews.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>
                          {pr.codeReviews.length} review
                          {pr.codeReviews.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary w-full sm:w-auto justify-center sm:justify-start"
              >
                View PR
                <GitPullRequest className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </LoadingWrapper>
  );
}
