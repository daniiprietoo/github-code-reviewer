"use client";
import { I18nProviderClient, useScopedI18n } from "@/locales/client";
import { buttonVariants } from "@github-code-reviewer/ui/button";
import { cn } from "@github-code-reviewer/ui/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

const LayoutContainer = ({ children }: { children: React.ReactNode }) => {
  const t = useScopedI18n("settings.sidebar");
  const pathname = usePathname();
  const isSettingsPath = pathname === "/settings";
  const isAiConfigPath = pathname === "/settings/ai-config";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative flex h-full w-full px-6 py-8">
        <div className="mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="hidden w-full max-w-64 flex-col gap-2 lg:flex">
            <div className="mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent mb-2">
                Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your account and application preferences
              </p>
            </div>

            <Link
              href="/settings"
              className={cn(
                `${buttonVariants({ variant: "ghost" })} ${isSettingsPath && "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"}`,
                "justify-start rounded-xl h-10 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <span
                className={cn(
                  `text-sm font-medium ${isSettingsPath ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`
                )}
              >
                {t("general")}
              </span>
            </Link>
            <Link
              href="/settings/ai-config"
              className={cn(
                `${buttonVariants({ variant: "ghost" })} ${isAiConfigPath && "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"}`,
                "justify-start rounded-xl h-10 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              <span
                className={cn(
                  `text-sm font-medium ${isAiConfigPath ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`
                )}
              >
                {t("aiConfig")}
              </span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  return (
    <I18nProviderClient locale={locale}>
      <LayoutContainer>{children}</LayoutContainer>
    </I18nProviderClient>
  );
}
