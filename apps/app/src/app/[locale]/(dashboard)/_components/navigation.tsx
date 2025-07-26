"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import type { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { Button, buttonVariants } from "@github-code-reviewer/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@github-code-reviewer/ui/dropdown-menu";
import { cn } from "@github-code-reviewer/ui/utils";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { Check, ChevronDown, ChevronUp, LogOut, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

export function Navigation({
  preloadedUser,
}: {
  preloadedUser: Preloaded<typeof api.users.getUser>;
}) {
  const { signOut } = useAuthActions();
  const pathname = usePathname();
  const router = useRouter();
  const isSettingsPath = pathname.includes("/settings");

  const user = usePreloadedQuery(preloadedUser);

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-col bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl px-4 py-3 border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between">
        <div className="flex h-10 items-center gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-3 py-2 data-[state=open]:bg-blue-50 dark:data-[state=open]:bg-blue-950/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/20"
                      alt={user.name ?? user.email}
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 ring-2 ring-blue-500/20" />
                  )}

                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {user?.name || ""}
                  </p>
                  <span className="flex h-5 items-center rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 px-2 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Free
                  </span>
                </div>
                <span className="flex flex-col items-center justify-center">
                  <ChevronUp className="relative top-[3px] h-[14px] w-[14px] stroke-[1.5px] text-gray-500" />
                  <ChevronDown className="relative bottom-[3px] h-[14px] w-[14px] stroke-[1.5px] text-gray-500" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="min-w-56 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-200/60 dark:border-gray-800/60 p-2 rounded-xl"
            >
              <DropdownMenuLabel className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                Personal Account
              </DropdownMenuLabel>
              <DropdownMenuItem className="h-10 w-full cursor-pointer justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    <img
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-blue-500/20"
                      alt={user.name ?? user.email}
                      src={user.avatarUrl}
                    />
                  ) : (
                    <span className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                  )}

                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {user.name || ""}
                  </p>
                </div>
                <Check className="h-[18px] w-[18px] stroke-[1.5px] text-blue-600 dark:text-blue-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation tabs with individual indicators for perfect alignment */}
        <div className="relative flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              `${buttonVariants({ variant: "ghost", size: "sm" })} text-gray-600 dark:text-gray-400 rounded-2xl transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex-1 justify-center relative font-semibold`,
              !isSettingsPath && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
            )}
          >
            Dashboard
            {/* Individual indicator for perfect alignment */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-opacity duration-300",
                !isSettingsPath ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>

          <Link
            href="/settings"
            className={cn(
              `${buttonVariants({ variant: "ghost", size: "sm" })} text-gray-600 dark:text-gray-400 rounded-2xl transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex-1 justify-center relative font-semibold`,
              isSettingsPath && "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
            )}
          >
            Settings
            {/* Individual indicator for perfect alignment */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-opacity duration-300",
                isSettingsPath ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>
        </div>

        <div className="flex h-10 items-center gap-3">
          <a
            href="https://github.com/daniiprietoo/github-code-reviewer"
            className={cn(
              `${buttonVariants({ variant: "outline", size: "sm" })} group hidden h-8 gap-2 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-3 pr-3 md:flex transition-all duration-200`
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 transition group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400">
              Repository
            </span>
          </a>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200">
                {user.avatarUrl ? (
                  <img
                    className="min-h-8 min-w-8 rounded-full object-cover ring-2 ring-blue-500/20"
                    alt={user.name ?? user.email}
                    src={user.avatarUrl}
                  />
                ) : (
                  <span className="min-h-8 min-w-8 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="fixed -right-4 min-w-56 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-200/60 dark:border-gray-800/60 p-2 rounded-xl"
            >
              <DropdownMenuItem className="group flex-col items-start focus:bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400">
                  {user?.name || ""}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </DropdownMenuItem>
              <Link
                href="/settings"
                className="group h-9 w-full cursor-pointer justify-between rounded-lg px-2"
              >
                <DropdownMenuItem className="group h-9 w-full cursor-pointer justify-between rounded-lg px-2 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400">
                    Settings
                  </span>
                  <Settings className="h-[18px] w-[18px] stroke-[1.5px] text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400" />
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className={cn(
                  "group flex h-9 justify-between rounded-lg px-2 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                )}
              >
                <span className="w-full text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400">
                  Theme
                </span>
                <ThemeSwitcher />
              </DropdownMenuItem>

              <DropdownMenuItem
                className={cn(
                  "group flex h-9 justify-between rounded-lg px-2 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                )}
              >
                <span className="w-full text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-focus:text-blue-600 dark:group-focus:text-blue-400">
                  Language
                </span>
                <LanguageSwitcher />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="mx-0 my-2" />

              <DropdownMenuItem
                className="group h-9 w-full cursor-pointer justify-between rounded-lg px-2 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => signOut()}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-focus:text-red-600 dark:group-focus:text-red-400">
                  Log Out
                </span>
                <LogOut className="h-[18px] w-[18px] stroke-[1.5px] text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-focus:text-red-600 dark:group-focus:text-red-400" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
