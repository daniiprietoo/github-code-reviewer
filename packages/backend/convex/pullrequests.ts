import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { getUserGitHubId } from "./utils/github";
import { getAuthUserId } from "@convex-dev/auth/server";

export const savePullRequest = mutation({
  args: {
    githubId: v.number(),
    repositoryGithubId: v.number(),
    number: v.number(),
    title: v.string(),
    body: v.union(v.string(), v.null()),
    author: v.string(),
    authorId: v.number(),
    headRef: v.string(),
    baseRef: v.string(),
    headSha: v.string(),
    baseSha: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // find the repository
    const repository = await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) =>
        q.eq("githubId", args.repositoryGithubId),
      )
      .first();

    if (!repository) {
      throw new Error("Repository not found");
    }

    // check if PR already exists
    const existingPR = await ctx.db
      .query("pullRequests")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    const prData = {
      githubId: args.githubId,
      repositoryId: repository._id,
      number: args.number,
      title: args.title,
      body: args.body || undefined,
      author: args.author,
      authorId: args.authorId,
      headRef: args.headRef,
      baseRef: args.baseRef,
      headSha: args.headSha,
      baseSha: args.baseSha,
      status: "pending" as const,
      url: args.url,
      createdAt: existingPR?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (existingPR) {
      await ctx.db.patch(existingPR._id, prData);
      return existingPR._id;
    }

    return await ctx.db.insert("pullRequests", prData);
  },
});

export const updatePullRequestStatus = internalMutation({
  args: {
    pullRequestId: v.id("pullRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pullRequestId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getRecentPullRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return [];
    }

    const githubId = await getUserGitHubId(ctx.db, userId);
    if (!githubId) {
      return [];
    }

    return await getUserAccessiblePullRequests(ctx, githubId, args.limit || 10);
  },
});

async function getUserAccessiblePullRequests(
  ctx: QueryCtx,
  githubId: number,
  limit: number,
) {
  // Get installations where user is the account owner
  const installations = await ctx.db
    .query("installations")
    .filter((q) => q.eq(q.field("accountId"), githubId))
    .collect();

  if (installations.length === 0) {
    return [];
  }

  // Get all repositories from user's installations
  const userRepositoryIds: Id<"repositories">[] = [];
  for (const installation of installations) {
    const repositories = await ctx.db
      .query("repositories")
      .withIndex("by_installation", (q) =>
        q.eq("installationId", installation._id),
      )
      .collect();
    userRepositoryIds.push(...repositories.map((repo) => repo._id));
  }

  if (userRepositoryIds.length === 0) {
    return [];
  }

  // Get pull requests from accessible repositories
  const allPullRequests = await ctx.db
    .query("pullRequests")
    .order("desc")
    .collect();

  const userPullRequests = allPullRequests
    .filter((pr) => userRepositoryIds.includes(pr.repositoryId))
    .slice(0, limit);

  // Enrich with repository and review data
  return await Promise.all(
    userPullRequests.map(async (pr) => {
      const repository = await ctx.db.get(pr.repositoryId);
      const codeReviews = await ctx.db
        .query("codeReviews")
        .withIndex("by_pull_request", (q) => q.eq("pullRequestId", pr._id))
        .collect();

      return {
        ...pr,
        repository,
        codeReviews,
      };
    }),
  );
}
