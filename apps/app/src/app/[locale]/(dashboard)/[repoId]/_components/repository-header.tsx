"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type { Doc } from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { Button } from "@github-code-reviewer/ui/button";
import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import {
  ArrowLeft,
  Code2,
  ExternalLink,
  GitBranch,
  Github,
  Globe,
  Lock,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Repository extends Doc<"repositories"> {}

export function RepositoryHeader({
  preloadedRepository,
}: {
  preloadedRepository: Preloaded<typeof api.repositories.getRepository>;
}) {
  const repository = usePreloadedQuery(preloadedRepository);

  const emptyState = (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (repository === undefined) {
    return <RepositoryHeaderSkeleton />;
  }

  if (repository === null) {
    return emptyState;
  }

  return <RepositoryHeaderContent repository={repository} />;
}

function RepositoryHeaderContent({ repository }: { repository: Repository }) {
  const router = useRouter();
  const disconnectRepository = useMutation(api.github.disconnectRepository);

  const handleDisconnect = async () => {
    try {
      await disconnectRepository({ repositoryId: repository._id });
      router.push("/");
    } catch (error) {
      console.error("Failed to disconnect repository:", error);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-6">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Repository Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Repository Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Github className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Repository Details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {repository.name}
              </h1>
              <div className="flex items-center gap-1">
                {repository.isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Private
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Repository Metadata */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">{repository.fullName}</span>
              {repository.language && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>{repository.language}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                <span>{repository.defaultBranch}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>
                  Created{" "}
                  {new Date(repository.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect
          </Button>

          <Link
            href={`https://github.com/${repository.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "flex items-center gap-2"
            )}
          >
            <Github className="h-4 w-4" />
            View on GitHub
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function RepositoryHeaderSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-6">
      <div className="mb-6">
        <div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-9 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
