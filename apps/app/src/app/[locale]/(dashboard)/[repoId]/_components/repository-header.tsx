"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type {
  Doc,
  Id,
} from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { Button } from "@github-code-reviewer/ui/button";
import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
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

export function RepositoryHeader({ repoId }: { repoId: string }) {
  const repository = useQuery(api.repositories.getRepository, {
    repositoryId: repoId as Id<"repositories">,
  });

  const emptyState = (
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 shadow-lg shadow-gray-500/10">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />
          <div className="h-4 w-64 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-lg shadow-gray-500/10 hover:shadow-xl hover:shadow-gray-500/15 transition-all duration-300">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/10 opacity-60" />

      {/* Back Navigation */}
      <div className="relative mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 py-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Repository Info */}
      <div className="relative flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Repository Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-900/50 shadow-lg shadow-blue-500/20">
            <Github className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Repository Details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                {repository.name}
              </h1>
              <div className="flex items-center gap-1.5">
                {repository.isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Private
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                      Public
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Repository Metadata */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
                {repository.fullName}
              </span>
              {repository.language && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <span className="font-medium">{repository.language}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="font-medium">{repository.defaultBranch}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Disconnect
          </Button>

          <Link
            href={`https://github.com/${repository.fullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
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
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 shadow-lg shadow-gray-500/10">
      <div className="mb-6">
        <div className="h-5 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 animate-pulse" />
          <div className="flex flex-col gap-3">
            <div className="h-8 w-48 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl animate-pulse" />
            <div className="h-4 w-96 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
