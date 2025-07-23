"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import type { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type { Doc } from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { type Preloaded, usePreloadedQuery } from "convex/react";
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

export function PullRequestsSection({
  preloadedPullRequests,
}: {
  preloadedPullRequests: Preloaded<
    typeof api.pullrequests.getPullRequestsForRepository
  >;
}) {
  const pullRequests = usePreloadedQuery(preloadedPullRequests);

  const emptyState = (
    <div className="rounded-xl border border-primary/20 bg-card p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 text-primary/80 bg-primary/5 font-medium text-sm">
          <GitPullRequest className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-primary">
            No pull requests yet
          </h3>
          <p className="text-base text-primary/60">
            Pull requests will appear here once they are opened in this
            repository.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <LoadingWrapper
      isLoading={pullRequests === undefined}
      loadingComponent={<PullRequestsSkeleton />}
      fallback={pullRequests === undefined ? emptyState : null}
    >
      {pullRequests && <PullRequestsContent pullRequests={pullRequests} />}
    </LoadingWrapper>
  );
}

function PullRequestsContent({
  pullRequests,
}: {
  pullRequests: PullRequestWithReviews[];
}) {
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const emptyState = (
    <div className="rounded-xl border border-primary/20 bg-card p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 text-primary/80 bg-primary/5 font-medium text-sm">
          <GitPullRequest className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-primary">
            No pull requests yet
          </h3>
          <p className="text-base text-primary/60">
            Pull requests will appear here once they are opened in this
            repository.
          </p>
        </div>
      </div>
    </div>
  );

  if (pullRequests.length === 0) {
    return emptyState;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary">
          Pull Request Analysis ({pullRequests.length})
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {pullRequests.map((pr) => (
          <div
            key={pr._id}
            className="group relative flex flex-col rounded-xl border border-primary/20 bg-card p-6 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/10 bg-secondary flex-shrink-0">
                  <GitPullRequest className="h-6 w-6 stroke-[2px] text-primary/60" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-primary">
                      #{pr.number} {pr.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(pr.status)}
                      <span className="text-sm font-medium text-primary/80 capitalize">
                        {pr.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary/60">
                    <span>by {pr.author}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(pr.createdAt)}</span>
                    </div>
                    <span className="font-mono text-xs bg-primary/5 px-2 py-1 rounded">
                      {pr.headRef} → {pr.baseRef}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "flex items-center gap-1"
                )}
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            {/* Code Review Results */}
            {pr.codeReviews && pr.codeReviews.length > 0 && (
              <div className="border-t border-primary/10 pt-4">
                <h4 className="text-sm font-semibold text-primary mb-3">
                  Analysis Results
                </h4>
                <div className="space-y-3">
                  {pr.codeReviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-secondary/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary/60" />
                          <span className="text-sm font-medium text-primary">
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
                        <div className="flex items-center gap-1 text-sm text-primary/60">
                          <MessageCircle className="h-4 w-4" />
                          <span>
                            {review.analysisResults?.length || 0} findings
                          </span>
                        </div>
                      </div>

                      {review.summary && (
                        <p className="text-sm text-primary/80 leading-relaxed">
                          {review.summary}
                        </p>
                      )}

                      {review.analysisResults &&
                        review.analysisResults.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-primary/10">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div className="text-center">
                                <div className="text-red-600 font-medium">
                                  {
                                    review.analysisResults.filter(
                                      (r) => r.severity === "high"
                                    ).length
                                  }
                                </div>
                                <div className="text-primary/60">High</div>
                              </div>
                              <div className="text-center">
                                <div className="text-yellow-600 font-medium">
                                  {
                                    review.analysisResults.filter(
                                      (r) => r.severity === "medium"
                                    ).length
                                  }
                                </div>
                                <div className="text-primary/60">Medium</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-600 font-medium">
                                  {
                                    review.analysisResults.filter(
                                      (r) => r.severity === "low"
                                    ).length
                                  }
                                </div>
                                <div className="text-primary/60">Low</div>
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
              <div className="border-t border-primary/10 pt-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    This pull request is queued for analysis. Results will
                    appear here once the review is complete.
                  </p>
                </div>
              </div>
            )}

            {pr.status === "error" && (
              <div className="border-t border-primary/10 pt-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    There was an error analyzing this pull request. Please try
                    again later.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PullRequestsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 bg-primary/10 rounded animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-primary/20 bg-card p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-6 w-64 bg-primary/10 rounded animate-pulse" />
                <div className="h-4 w-96 bg-primary/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
