"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import type { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { PullRequestListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Completed",
          color:
            "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
        };
      case "error":
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: "Error",
          color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
        };
      case "analyzing":
        return {
          icon: <Clock className="h-4 w-4 animate-spin" />,
          text: "Analyzing",
          color:
            "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Pending",
          color:
            "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400",
        };
    }
  };

  const emptyState = (
    <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
          <GitPullRequest className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          No pull requests found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recent pull requests will appear here once you have some activity.
        </p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Pull Requests
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {pullRequests?.length || 0} pull requests
        </span>
      </div>

      <LoadingWrapper
        isLoading={pullRequests === undefined}
        loadingComponent={<PullRequestListSkeleton />}
        fallback={pullRequests?.length === 0 ? emptyState : null}
      >
        <div className="space-y-3">
          {pullRequests?.map((pr) => {
            const statusConfig = getStatusConfig(pr.status);

            return (
              <div
                key={pr._id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-4 transition-all hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 flex-shrink-0 mt-0.5">
                      <GitPullRequest className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          #{pr.number} {pr.title}
                        </h3>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.text}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          {pr.repository?.fullName}
                        </span>
                        <span>by @{pr.author}</span>
                        <span className="hidden sm:inline">
                          {pr.headRef} → {pr.baseRef}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(pr.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
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
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </LoadingWrapper>
    </div>
  );
}
