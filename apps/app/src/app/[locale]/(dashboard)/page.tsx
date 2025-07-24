import { getScopedI18n } from "@/locales/server";

export const metadata = {
  title: "Dashboard",
};

import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { preloadQuery } from "convex/nextjs";
import { Plus } from "lucide-react";
import Link from "next/link";
import RecentPullRequestList from "./_components/recent-pull-request-list";
import RepositoryList from "./_components/repository-list";

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  const preloadedPullRequests = await preloadQuery(
    api.pullrequests.getRecentPullRequests,
    { limit: 5 },
    { token: await convexAuthNextjsToken() }
  );

  const preloadedRepositories = await preloadQuery(
    api.repositories.getUserRepositories,
    {},
    { token: await convexAuthNextjsToken() }
  );

  return (
    <div className="min-h-screen bg-secondary dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t("bodyTitle")}
              </h1>
            </div>
            <Link
              href="https://github.com/apps/dev-code-reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex items-center gap-2"
              )}
            >
              <Plus className="h-4 w-4" />
              {t("connectMoreRepos")}
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <RepositoryList preloadedRepositories={preloadedRepositories} />
          <RecentPullRequestList
            preloadedPullRequests={preloadedPullRequests}
          />
        </div>
      </div>
    </div>
  );
}
