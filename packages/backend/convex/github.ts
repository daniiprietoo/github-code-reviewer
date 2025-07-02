import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { getUserGitHubId } from "./utils/github";

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
