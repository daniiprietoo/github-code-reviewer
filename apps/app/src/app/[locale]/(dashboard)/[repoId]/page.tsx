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
    <div className="min-h-screen bg-secondary dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Repository Header */}
        <RepositoryHeader preloadedRepository={preloadedRepository} />

        {/* Pull Requests Section */}
        <div className="mt-8">
          <PullRequestsSection preloadedPullRequests={preloadedPullRequests} />
        </div>
      </div>
    </div>
  );
}
