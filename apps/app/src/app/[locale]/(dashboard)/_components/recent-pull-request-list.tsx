"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { PullRequestListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  GitPullRequest,
  MessageCircle,
  XCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";

export default function PullRequestList() {
  const pullRequests = useQuery(api.pullrequests.getRecentPullRequests, {
    limit: 10,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Completed",
          color:
            "text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-800",
        };
      case "error":
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: "Error",
          color: "text-red-700 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
        };
      case "analyzing":
        return {
          icon: <Clock className="h-4 w-4 animate-spin" />,
          text: "Analyzing",
          color:
            "text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Pending",
          color:
            "text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        };
    }
  };

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 mb-4">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No pull requests found
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Recent pull requests will appear here once you have some activity.
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300">
            <div className="h-2 w-2 rounded-full bg-purple-500" />
            {pullRequests?.length || 0} recent
          </span>
        </div>
      </div>

      {pullRequests === undefined ? (
        <PullRequestListSkeleton />
      ) : pullRequests.length === 0 ? (
        emptyState
      ) : (
        <div className="space-y-4">
          {pullRequests.map((pr) => {
            const statusConfig = getStatusConfig(pr.status);

            return (
              <div
                key={pr._id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-5 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5"
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/30 dark:from-purple-950/20 dark:via-transparent dark:to-pink-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex items-start justify-between">
                  <div className="relative flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-purple-100 group-hover:to-pink-100 dark:group-hover:from-purple-900/50 dark:group-hover:to-pink-900/50 flex-shrink-0 transition-all duration-300">
                      <GitPullRequest className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-purple-900 dark:group-hover:text-purple-100 transition-colors duration-300">
                          #{pr.number} {pr.title}
                        </h3>
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.text}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {pr.repository?.fullName}
                        </span>
                        <span>by @{pr.author}</span>
                        <span className="hidden sm:inline font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {pr.headRef} → {pr.baseRef}
                        </span>
                        <div className="flex items-center gap-1.5">
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
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
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
                    className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 flex-shrink-0 border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
