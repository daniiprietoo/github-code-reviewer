import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  getUserGitHubId,
  getUserInstallationIds,
  hasRepositoryAccess,
} from "./utils/github";

export const getRepositoriesByInstallation = query({
  args: { installationId: v.id("installations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", args.installationId),
      )
      .collect();
  },
});

export const getUserRepositories = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the user's GitHub ID
    const githubId = await getUserGitHubId(ctx.db, userId);
    if (!githubId) {
      return [];
    }

    // Get installations where the user has access
    const installationIds = await getUserInstallationIds(ctx.db, githubId);
    if (installationIds.length === 0) {
      return [];
    }

    // Get all repositories from accessible installations
    const repositories = [];
    for (const installationId of installationIds) {
      const installationRepos = await ctx.db
        .query("repositories")
        .withIndex("by_installation", (q) =>
          q.eq("installationId", installationId),
        )
        .collect();
      repositories.push(...installationRepos);
    }

    return repositories;
  },
});

export const getRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has access to this repository
    const hasAccess = await hasRepositoryAccess(
      ctx.db,
      userId,
      args.repositoryId,
    );
    if (!hasAccess) {
      throw new Error("Repository not found or access denied");
    }

    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      throw new Error("Repository not found");
    }

    return repository;
  },
});
