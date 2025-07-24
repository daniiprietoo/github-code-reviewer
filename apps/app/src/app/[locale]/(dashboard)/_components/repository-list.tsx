"use client";

import { useScopedI18n } from "@/locales/client";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { Button } from "@github-code-reviewer/ui/button";
import { RepositoryListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { Calendar, Code, ExternalLink, Github, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function RepositoryList({
  preloadedRepositories,
}: {
  preloadedRepositories: Preloaded<typeof api.repositories.getUserRepositories>;
}) {
  const t = useScopedI18n("dashboard");

  const updateGitHubId = useMutation(api.github.updateUserGitHubId);
  const repositories = usePreloadedQuery(preloadedRepositories);
  const disconnectRepository = useMutation(api.github.disconnectRepository);

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

  const emptyState = (
    <div className="col-span-full">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Github className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t("title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          {t("description")}
        </p>
        <Link
          href="https://github.com/apps/dev-code-reviewer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-100"
        >
          Install GitHub App
          <Github className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Repositories
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {repositories?.length || 0} repositories
        </span>
      </div>

      {repositories === undefined ? (
        <RepositoryListSkeleton />
      ) : repositories.length === 0 ? (
        emptyState
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repository) => (
            <div
              key={repository._id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card p-6 transition-all hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md"
            >
              {/* Repository Icon and Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`https://github.com/${repository.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      disconnectRepository({ repositoryId: repository._id });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Repository Info */}
              <Link
                href={`/${repository._id}`}
                prefetch={true}
                className="block cursor-pointer"
              >
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {repository.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {repository.fullName}
                  </p>
                </div>

                {/* Repository Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    {repository.language && (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{repository.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(repository.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
