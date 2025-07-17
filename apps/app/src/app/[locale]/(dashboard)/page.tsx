import { Header } from "@/app/[locale]/(dashboard)/_components/header";
import { getScopedI18n } from "@/locales/server";

export const metadata = {
  title: "Dashboard",
};

import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import { Github, Plus } from "lucide-react";
import Link from "next/link";
import RepositoryList from "./_components/repository-list";

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  return (
    <>
      <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
            <div className="flex w-full flex-col rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-primary">
                    {t("bodyTitle")}
                  </h2>
                  <p className="text-sm font-normal text-primary/60">
                    {t("bodyDescription")}
                  </p>
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
            <RepositoryList />
          </div>
        </div>
      </div>
    </>
  );
}
