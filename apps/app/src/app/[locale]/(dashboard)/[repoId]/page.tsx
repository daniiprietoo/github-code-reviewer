import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type { Id } from "@github-code-reviewer/backend/convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import { PullRequestsSection } from "./_components/pullrequests-client";
import { RepositoryHeader } from "./_components/repository-header";

export default async function Page({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;

  const [preloadedRepository, preloadedPullRequests] = await Promise.all([
    preloadQuery(
      api.repositories.getRepository,
      { repositoryId: repoId as Id<"repositories"> },
      { token: await convexAuthNextjsToken() }
    ),
    preloadQuery(
      api.pullrequests.getPullRequestsForRepository,
      { repositoryId: repoId as Id<"repositories"> },
      { token: await convexAuthNextjsToken() }
    ),
  ]);

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
        <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
          {/* Repository Header */}
          <RepositoryHeader preloadedRepository={preloadedRepository} />

          {/* Pull Requests Section */}
          <div className="w-full p-6">
            <PullRequestsSection
              preloadedPullRequests={preloadedPullRequests}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
