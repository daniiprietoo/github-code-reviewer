import { getScopedI18n } from "@/locales/server";

export const metadata = {
  title: "Dashboard",
};

import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { Plus, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import RecentPullRequestList from "./_components/recent-pull-request-list";
import RepositoryList from "./_components/repository-list";

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative mb-12">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                    {t("bodyTitle")}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Automate your code reviews with AI-powered insights
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="https://github.com/apps/dev-code-reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
              )}
            >
              <Plus className="h-4 w-4" />
              {t("connectMoreRepos")}
              <Sparkles className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative space-y-12">
          <RepositoryList />
          <RecentPullRequestList />
        </div>
      </div>
    </div>
  );
}
