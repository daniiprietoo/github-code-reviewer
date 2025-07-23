"use client";

import { LoadingWrapper } from "@/components/loading-wrapper";
import type { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type { Doc } from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import Link from "next/link";
import { Github, Lock, Globe, Code2, GitBranch, ExternalLink } from "lucide-react";
import { cn } from "@github-code-reviewer/ui/utils";
import { buttonVariants } from "@github-code-reviewer/ui/button";

interface Repository extends Doc<"repositories"> {}

export function RepositoryHeader({
  preloadedRepository,
}: {
  preloadedRepository: Preloaded<typeof api.repositories.getRepository>;
}) {
  const repository = usePreloadedQuery(preloadedRepository);

  const emptyState = (
    <div className="flex w-full flex-col rounded-lg p-6 border-b border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-primary/10 rounded animate-pulse" />
            <div className="h-4 w-64 bg-primary/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-primary/10 rounded animate-pulse" />
      </div>
    </div>
  );

  return (
    <LoadingWrapper
      isLoading={repository === undefined}
      loadingComponent={<RepositoryHeaderSkeleton />}
      fallback={repository === undefined ? emptyState : null}
    >
      {repository && <RepositoryHeaderContent repository={repository} />}
    </LoadingWrapper>
  );
}

function RepositoryHeaderContent({ repository }: { repository: Repository }) {
  return (
    <div className="flex w-full flex-col rounded-lg p-6 border-b border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
            <Github className="h-8 w-8 text-primary/80" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">
                {repository.name}
              </h1>
              <div className="flex items-center gap-1">
                {repository.isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 text-primary/60" />
                    <span className="text-sm font-medium text-primary/60">
                      Private
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-primary/60" />
                    <span className="text-sm font-medium text-primary/60">
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-primary/60">
              <span className="font-mono">{repository.fullName}</span>
              {repository.language && (
                <div className="flex items-center gap-1">
                  <Code2 className="h-4 w-4" />
                  <span>{repository.language}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>{repository.defaultBranch}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`https://github.com/${repository.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "flex items-center gap-2"
          )}
        >
          View on GitHub
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function RepositoryHeaderSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg p-6 border-b border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-primary/10 rounded animate-pulse" />
            <div className="h-4 w-64 bg-primary/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-primary/10 rounded animate-pulse" />
      </div>
    </div>
  );
}
