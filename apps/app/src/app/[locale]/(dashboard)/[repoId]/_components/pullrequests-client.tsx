"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type {
  Doc,
  Id,
} from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { cn } from "@github-code-reviewer/ui/utils";
import { useQuery } from "convex/react";
import {
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
    <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <GitPullRequest className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No pull requests yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
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
    <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12">
      <div className="flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <GitPullRequest className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No pull requests yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pull Request Analysis
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {pullRequests.length} pull requests
        </span>
      </div>

      <div className="space-y-4">
        {pullRequests.map((pr) => {
          const statusConfig = getStatusConfig(pr.status);

          return (
            <div
              key={pr._id}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-6 transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <GitPullRequest className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        #{pr.number} {pr.title}
                      </h3>
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.text}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>by @{pr.author}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(pr.createdAt)}</span>
                      </div>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {pr.headRef} → {pr.baseRef}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
                >
                  View PR
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {/* Code Review Results */}
              {pr.codeReviews && pr.codeReviews.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Analysis Results
                  </h4>
                  <div className="space-y-3">
                    {pr.codeReviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Overall Score
                            </span>
                            <span
                              className={cn(
                                "text-sm font-bold",
                                getScoreColor(review.overallScore)
                              )}
                            >
                              {review.overallScore}/100
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <MessageCircle className="h-4 w-4" />
                            <span>
                              {review.analysisResults?.length || 0} findings
                            </span>
                          </div>
                        </div>

                        {review.summary && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                            {review.summary}
                          </p>
                        )}

                        {review.analysisResults &&
                          review.analysisResults.length > 0 && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                  <div className="text-red-600 dark:text-red-400 font-medium text-lg">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "high"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    High
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-yellow-600 dark:text-yellow-400 font-medium text-lg">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "medium"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Medium
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-green-600 dark:text-green-400 font-medium text-lg">
                                    {
                                      review.analysisResults.filter(
                                        (r) => r.severity === "low"
                                      ).length
                                    }
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Low
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
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This pull request is queued for analysis. Results will
                      appear here once the review is complete.
                    </p>
                  </div>
                </div>
              )}

              {pr.status === "error" && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-6 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
