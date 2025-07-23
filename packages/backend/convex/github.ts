import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { getUserGitHubId, hasRepositoryAccess } from "./utils/github";
import { v } from "convex/values";
import { Octokit } from "@octokit/rest";
import { env } from "./env";

export const getCurrentUserGitHubId = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await getUserGitHubId(ctx.db, userId);
  },
});

export const updateUserGitHubId = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get GitHub ID from auth accounts
    const githubId = await getUserGitHubId(ctx.db, userId);
    if (!githubId) {
      throw new Error("GitHub account not found");
    }

    // Update the user record with the GitHub ID
    await ctx.db.patch(userId, { githubId });

    return githubId;
  },
});

export const disconnectRepository = mutation({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const hasAccess = await hasRepositoryAccess(ctx.db, userId, args.repositoryId);

    if (!hasAccess) {
      throw new Error("Permission denied");
    }

    // await ctx.db.delete(args.repositoryId);

    try {
      // POST to github to remove the repository from the app
      const octokit = new Octokit({
        auth: env.GITHUB_APP_PRIVATE_KEY,
        appId: env.GITHUB_APP_ID,
        userAgent: "github-code-reviewer",
      });

      console.log("connected to github");

      // await octokit.rest.apps.removeRepoFromInstallationForAuthenticatedUser({
      //   installation_id: Number(repository.installationId),
      //   repository_id: repository.githubId,
      // });
    } catch (error) {
      console.error("Error removing repository from app:", error);
    }

    return {
      success: true,
    };
  },
});
