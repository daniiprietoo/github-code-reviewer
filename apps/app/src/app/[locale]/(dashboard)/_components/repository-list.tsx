"use client";

import { useScopedI18n } from "@/locales/client";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { Button } from "@github-code-reviewer/ui/button";
import { RepositoryListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { useMutation, useQuery } from "convex/react";
import { Calendar, ExternalLink, Github, Trash2, GitBranch, Lock, Globe, Star } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function RepositoryList() {
  const t = useScopedI18n("dashboard");

  const updateGitHubId = useMutation(api.github.updateUserGitHubId);
  const repositories = useQuery(api.repositories.getUserRepositories);
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-6">
          <Github className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {t("title")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-lg mb-8 leading-relaxed">
          {t("description")}
        </p>
        <Link
          href={`${process.env.NEXT_PUBLIC_GITHUB_APP_URL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
        >
          <Star className="h-4 w-4" />
          Install GitHub App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
            <Github className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Connected Repositories
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {repositories?.length || 0} active
          </span>
        </div>
      </div>

      {repositories === undefined ? (
        <RepositoryListSkeleton />
      ) : repositories.length === 0 ? (
        emptyState
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repository) => (
            <div
              key={repository._id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Repository Icon and Actions */}
              <div className="relative flex items-start justify-between mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-900/50 dark:group-hover:to-indigo-900/50 transition-all duration-300">
                  <Github className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Link
                    href={`https://github.com/${repository.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
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
                className="relative block cursor-pointer"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
                      {repository.name}
                    </h3>
                    {repository.isPrivate ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Globe className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono">
                    {repository.fullName}
                  </p>
                </div>

                {/* Repository Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {repository.language && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{repository.language}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <GitBranch className="h-3 w-3" />
                      <span>{repository.defaultBranch}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
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
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}