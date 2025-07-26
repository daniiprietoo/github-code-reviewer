"use client";

import { useScopedI18n } from "@/locales/client";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import type { Id } from "@github-code-reviewer/backend/convex/_generated/dataModel";
import * as validators from "@github-code-reviewer/backend/convex/utils/validators";
import { Button } from "@github-code-reviewer/ui/button";
import { Input } from "@github-code-reviewer/ui/input";
import { UploadInput } from "@github-code-reviewer/ui/upload-input";
import type { UploadFileResponse } from "@github-code-reviewer/ui/upload-input";
import { useDoubleCheck } from "@github-code-reviewer/ui/utils";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useAction, useMutation, useQuery } from "convex/react";
import { Image, Upload, User, UserX } from "lucide-react";

export default function DashboardSettings() {
  const t = useScopedI18n("settings");
  const user = useQuery(api.users.getUser);
  const { signOut } = useAuthActions();
  const updateUserImage = useMutation(api.users.updateUserImage);
  const updateUsername = useMutation(api.users.updateUsername);
  const removeUserImage = useMutation(api.users.removeUserImage);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const deleteCurrentUserAccount = useAction(
    api.users.deleteCurrentUserAccount
  );
  const { doubleCheck, getButtonProps } = useDoubleCheck();

  const handleUpdateUserImage = (uploaded: UploadFileResponse[]) => {
    return updateUserImage({
      imageId: (uploaded[0]?.response as { storageId: Id<"_storage"> })
        .storageId,
    });
  };

  const handleDeleteAccount = async () => {
    await deleteCurrentUserAccount();
    signOut();
  };

  const usernameForm = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      username: user?.username || "",
    },
    onSubmit: async ({ value }) => {
      await updateUsername({ username: value.username || "" });
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col gap-8">
      {/* Avatar */}
      <div className="relative overflow-hidden flex w-full flex-col items-start rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg shadow-gray-500/10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/10 opacity-60" />

        <div className="relative flex w-full items-start justify-between rounded-2xl p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Image className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                {t("avatar.title")}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("avatar.description")}
            </p>
          </div>
          <label
            htmlFor="avatar_field"
            className="group relative flex cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-blue-500/20"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                alt={user.username ?? user.email}
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-2 border-white dark:border-gray-800 shadow-lg" />
            )}
            <div className="absolute z-10 hidden h-full w-full items-center justify-center bg-black/40 backdrop-blur-sm group-hover:flex transition-all duration-200">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </label>
          <UploadInput
            id="avatar_field"
            type="file"
            accept="image/*"
            className="peer sr-only"
            required
            tabIndex={user ? -1 : 0}
            generateUploadUrl={generateUploadUrl}
            onUploadComplete={handleUpdateUserImage}
          />
        </div>
        <div className="relative flex min-h-14 w-full items-center justify-between rounded-2xl rounded-t-none border-t border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/50 dark:from-gray-800/80 dark:to-blue-950/30 px-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("avatar.uploadHint")}
          </p>
          {user.avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                removeUserImage({});
              }}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
            >
              {t("avatar.resetButton")}
            </Button>
          )}
        </div>
      </div>

      {/* Username */}
      <form
        className="relative overflow-hidden flex w-full flex-col items-start rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg shadow-gray-500/10"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          usernameForm.handleSubmit();
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-emerald-50/30 dark:from-green-950/20 dark:via-transparent dark:to-emerald-950/10 opacity-60" />

        <div className="relative flex w-full flex-col gap-4 rounded-2xl p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 dark:from-white dark:via-green-200 dark:to-emerald-200 bg-clip-text text-transparent">
                Your Username
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              This is your username. It will be displayed on your profile.
            </p>
          </div>
          <usernameForm.Field
            name="username"
            validators={{
              onSubmit: validators.username,
            }}
            // biome-ignore lint/correctness/noChildrenProp: <explanation>
            children={(field) => (
              <Input
                placeholder="Username"
                autoComplete="off"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`w-80 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 ${
                  field.state.meta?.errors.length > 0 &&
                  "border-destructive focus-visible:ring-destructive"
                }`}
              />
            )}
          />
          {usernameForm.state.fieldMeta.username?.errors.length > 0 && (
            <p className="text-sm text-destructive dark:text-destructive-foreground font-medium">
              {usernameForm.state.fieldMeta.username?.errors.join(" ")}
            </p>
          )}
        </div>
        <div className="relative flex min-h-14 w-full items-center justify-between rounded-2xl rounded-t-none border-t border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-green-50/50 dark:from-gray-800/80 dark:to-green-950/30 px-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please use 32 characters at maximum.
          </p>
          <Button
            type="submit"
            size="sm"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
          >
            Save
          </Button>
        </div>
      </form>

      {/* Delete Account */}
      <div className="relative overflow-hidden flex w-full flex-col items-start rounded-2xl border border-red-300/60 dark:border-red-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg shadow-red-500/10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-transparent to-rose-50/30 dark:from-red-950/20 dark:via-transparent dark:to-rose-950/10 opacity-60" />

        <div className="relative flex flex-col gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <UserX className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-red-800 to-rose-800 dark:from-white dark:via-red-200 dark:to-rose-200 bg-clip-text text-transparent">
              {t("deleteAccount.title")}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t("deleteAccount.description")}
          </p>
        </div>
        <div className="relative flex min-h-14 w-full items-center justify-between rounded-2xl rounded-t-none border-t border-red-200/60 dark:border-red-800/60 bg-gradient-to-r from-red-50/80 to-rose-50/50 dark:from-red-900/20 dark:to-rose-900/20 px-6">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
            {t("deleteAccount.warning")}
          </p>
          <Button
            size="sm"
            variant="destructive"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 border-0 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
            {...getButtonProps({
              onClick: doubleCheck ? handleDeleteAccount : undefined,
            })}
          >
            {doubleCheck
              ? t("deleteAccount.confirmButton")
              : t("deleteAccount.deleteButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
