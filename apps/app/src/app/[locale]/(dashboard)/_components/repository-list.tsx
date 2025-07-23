"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import { useScopedI18n } from "@/locales/client";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { Button } from "@github-code-reviewer/ui/button";
import { RepositoryListSkeleton } from "@github-code-reviewer/ui/skeleton";
import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { Calendar, Code, Github } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RepositoryList({
  preloadedRepositories,
}: {
  preloadedRepositories: Preloaded<typeof api.repositories.getUserRepositories>;
}) {
  const t = useScopedI18n("dashboard");
  const router = useRouter()

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
    <div className="rounded-xl border border-primary/20 bg-card p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 text-primary/80 bg-primary/5 font-medium text-sm">
          <Github className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-primary">{t("title")}</h3>
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
  );

  return (
    <LoadingWrapper
      isLoading={repositories === undefined}
      loadingComponent={<RepositoryListSkeleton />}
      fallback={repositories?.length === 0 ? emptyState : null}
    >
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4">
          Repositories connected to your account
        </h2>
        <div className="flex flex-col gap-4">
          {repositories?.map((repository) => (
            <div
              key={repository._id}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-primary/20 bg-card p-4 sm:gap-0 gap-4"
              onClick={() => router.push(`/${repository._id}`)}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/${repository._id}`);
                }
              }}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/10 bg-secondary flex-shrink-0">
                  <Github className="h-6 w-6 stroke-[2px] text-primary/60" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-primary truncate">
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
                  <div className="flex flex-wrap items-center gap-2 text-sm text-primary/60">
                    <span className="font-mono truncate">
                      {repository.fullName}
                    </span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(repository.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto rounded-lg px-3 py-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-colors duration-400"
                  onClick={() =>
                    disconnectRepository({ repositoryId: repository._id })
                  }
                >
                  Disconnect
                </Button>
                <Link
                  href={`https://github.com/${repository.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary w-full sm:w-auto justify-center sm:justify-start"
                >
                  View on GitHub
                  <Github className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingWrapper>
  );
}
