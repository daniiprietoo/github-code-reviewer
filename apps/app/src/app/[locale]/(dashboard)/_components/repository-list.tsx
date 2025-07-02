"use client";

import { useScopedI18n } from "@/locales/client";
import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Code,
  GitPullRequest,
  Github,
  MessageCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function RepositoryList() {
  const t = useScopedI18n("dashboard");

  const updateGitHubId = useMutation(api.github.updateUserGitHubId);
  const repositories = useQuery(api.repositories.getUserRepositories);
  const recentPullRequests = useQuery(api.pullrequests.getRecentPullRequests, {
    limit: 5,
  });

  useEffect(() => {
    const handleUpdateGitHubId = async () => {
      try {
        await updateGitHubId();
      } catch (error) {
        console.error("Failed to update GitHub ID:", error);
      }
    };

    handleUpdateGitHubId();
  }, [updateGitHubId]);

  // Helper function to render status icon
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

  // Loading state
  if (repositories === undefined || recentPullRequests === undefined) {
    return (
      <div className="w-full p-6">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((id) => (
            <div
              key={`loading-skeleton-${id}`}
              className="flex items-center justify-between rounded-xl border border-primary/20 bg-card p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-primary/20" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-primary/20" />
                  <div className="h-4 w-48 animate-pulse rounded bg-primary/20" />
                </div>
              </div>
              <div className="h-10 w-32 animate-pulse rounded-lg bg-primary/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty repositories state
  if (!repositories || repositories.length === 0) {
    return (
      <div className="w-full p-6">
        <div className="rounded-xl border border-primary/20 bg-card p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-secondary">
              <Github className="h-8 w-8 stroke-[1.5px] text-primary/60" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-primary">
                {t("title")}
              </h3>
              <p className="text-base text-primary/60">{t("description")}</p>
              <Link
                href="https://github.com/apps/dev-code-reviewer"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary w-fit"
              >
                Install GitHub App
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-8">
      {/* Repositories Section */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4">
          Repositories connected to your account
        </h2>
        <div className="flex flex-col gap-4">
          {repositories.map((repository) => (
            <div
              key={repository._id}
              className="group relative flex items-center justify-between rounded-xl border border-primary/20 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/10 bg-secondary">
                  <Github className="h-6 w-6 stroke-[1.5px] text-primary/60" />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-primary">
                      {repository.name}
                    </h3>
                    {repository.language && (
                      <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-1">
                        <Code className="h-3 w-3 text-primary/60" />
                        <span className="text-xs font-medium text-primary/80">
                          {repository.language}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-primary/60">
                    <span className="font-mono">{repository.fullName}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(repository.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`https://github.com/${repository.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                View on GitHub
                <Github className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Pull Requests Section */}
      {recentPullRequests && recentPullRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-primary mb-4">
            Recent Pull Requests
          </h2>
          <div className="flex flex-col gap-4">
            {recentPullRequests.map((pr) => (
              <div
                key={pr._id}
                className="group relative flex items-center justify-between rounded-xl border border-primary/20 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/10 bg-secondary">
                    <GitPullRequest className="h-6 w-6 stroke-[1.5px] text-primary/60" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-primary">
                        #{pr.number} {pr.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(pr.status)}
                        <span className="text-xs font-medium text-primary/80 capitalize">
                          {pr.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-primary/60">
                      <span className="font-mono">
                        {pr.repository?.fullName}
                      </span>
                      <span>by @{pr.author}</span>
                      <span>
                        {pr.headRef} → {pr.baseRef}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(pr.createdAt).toLocaleDateString()}
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
                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  View PR
                  <GitPullRequest className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
