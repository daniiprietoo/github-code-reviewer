"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type {
  Doc,
  Id,
} from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { cn } from "@github-code-reviewer/ui/utils";
import { useQuery } from "convex/react";
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  GitPullRequest,
  MessageCircle,
  Star,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface CodeReviewResult {
  file: string;
  line?: number;
  endLine?: number;
  severity: string;
  category: string;
  ruleId: string;
  message: string;
  suggestion?: string;
  confidence: number;
}

interface CodeReview extends Doc<"codeReviews"> {
  analysisResults: CodeReviewResult[];
}

export interface PullRequestWithReviews extends Doc<"pullRequests"> {
  codeReviews: CodeReview[];
}

export function PullRequestsSection({ repoId }: { repoId: string }) {
  const pullRequests = useQuery(api.pullrequests.getPullRequestsForRepository, {
    repositoryId: repoId as Id<"repositories">,
  });

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-16 shadow-lg shadow-purple-500/10">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 mb-6">
          <Activity className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          No pull requests yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md leading-relaxed">
          Pull requests will appear here once they are opened in this
          repository.
        </p>
      </div>
    </div>
  );

  if (pullRequests === undefined) {
    return <PullRequestsSkeleton />;
  }

  if (pullRequests.length === 0) {
    return emptyState;
  }

  return <PullRequestsContent pullRequests={pullRequests} />;
}

function PullRequestsContent({
  pullRequests,
}: {
  pullRequests: PullRequestWithReviews[];
}) {
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
          color:
            "text-red-700 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-purple-200 dark:border-purple-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-16 shadow-lg shadow-purple-500/10">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 mb-6">
          <Activity className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          No pull requests yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md leading-relaxed">
          Pull requests will appear here once they are opened in this
          repository.
        </p>
      </div>
    </div>
  );

  if (pullRequests.length === 0) {
    return emptyState;
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
            <GitPullRequest className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Pull Request Analysis
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <div className="h-2 w-2 rounded-full bg-purple-500" />
          {pullRequests.length} pull requests
        </span>
      </div>

      <div className="space-y-6">
        {pullRequests.map((pr) => {
          const statusConfig = getStatusConfig(pr.status);

          return (
            <div
              key={pr._id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/30 dark:from-purple-950/20 dark:via-transparent dark:to-pink-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-purple-100 group-hover:to-pink-100 dark:group-hover:from-purple-900/50 dark:group-hover:to-pink-900/50 flex-shrink-0 transition-all duration-300 shadow-lg shadow-gray-500/10">
                    <GitPullRequest className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-purple-900 dark:group-hover:text-purple-100 transition-colors duration-300">
                        #{pr.number} {pr.title}
                      </h3>
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.text}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">by @{pr.author}</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(pr.createdAt)}</span>
                      </div>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded-lg">
                        {pr.headRef} → {pr.baseRef}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 flex-shrink-0 border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
                >
                  View PR
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Code Review Results */}
              {pr.codeReviews && pr.codeReviews.length > 0 && (
                <div className="relative border-t border-gray-200/60 dark:border-gray-700/60 pt-6">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Analysis Results
                  </h4>
                  <div className="space-y-4">
                    {pr.codeReviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                              <Star className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              Overall Score
                            </span>
                            <span
                              className={cn(
                                "text-lg font-bold px-3 py-1 rounded-full bg-white dark:bg-gray-800 border",
                                getScoreColor(review.overallScore)
                              )}
                            >
                              {review.overallScore}/100
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">
                              {review.analysisResults?.length || 0} findings
                            </span>
                          </div>
                        </div>

                        {review.summary && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 bg-white/50 dark:bg-gray-800/30 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                            {review.summary}
                          </p>
                        )}

                        {review.analysisResults &&
                          review.analysisResults.length > 0 && (
                            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-red-50/80 dark:bg-red-900/20 rounded-lg p-3 border border-red-200/50 dark:border-red-800/50">
                                  <div className="text-red-600 dark:text-red-400 font-bold text-2xl">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "high"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-xs font-semibold text-red-700 dark:text-red-300 mt-1">
                                    High Priority
                                  </div>
                                </div>
                                <div className="bg-yellow-50/80 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200/50 dark:border-yellow-800/50">
                                  <div className="text-yellow-600 dark:text-yellow-400 font-bold text-2xl">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "medium"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mt-1">
                                    Medium Priority
                                  </div>
                                </div>
                                <div className="bg-green-50/80 dark:bg-green-900/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
                                  <div className="text-green-600 dark:text-green-400 font-bold text-2xl">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "low"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-xs font-semibold text-green-700 dark:text-green-300 mt-1">
                                    Low Priority
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pr.status === "pending" && (
                <div className="relative border-t border-gray-200/60 dark:border-gray-700/60 pt-4">
                  <div className="bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200/60 dark:border-yellow-800/60 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      This pull request is queued for analysis. Results will
                      appear here once the review is complete.
                    </p>
                  </div>
                </div>
              )}

              {pr.status === "error" && (
                <div className="relative border-t border-gray-200/60 dark:border-gray-700/60 pt-4">
                  <div className="bg-gradient-to-r from-red-50/80 to-rose-50/80 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/60 dark:border-red-800/60 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                      There was an error analyzing this pull request. Please try
                      again later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PullRequestsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-64 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />
        <div className="h-8 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-lg shadow-gray-500/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
              <div className="flex flex-col gap-3 flex-1">
                <div className="h-6 w-80 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
                <div className="h-4 w-96 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
