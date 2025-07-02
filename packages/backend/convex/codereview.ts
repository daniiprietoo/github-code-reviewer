import { getAuthUserId } from "@convex-dev/auth/server";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { env } from "./env";

// Create GitHub App authentication
function createGitHubApp(installationId: number) {
  // Properly format the private key by replacing escaped newlines
  const privateKey = env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");

  const auth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey,
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
  });

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey,
      installationId,
    },
  });
}

export const processPullRequest = internalAction({
  args: {
    pullRequestId: v.id("pullRequests"),
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`Processing pull request: ${args.pullRequestId}`);

    // Get the pull request details
    const pullRequest = await ctx.runQuery(
      internal.codereview.getPullRequestDetails,
      {
        pullRequestId: args.pullRequestId,
      },
    );

    if (!pullRequest) {
      throw new Error("Pull request not found");
    }

    // Create GitHub client for the installation
    const octokit = createGitHubApp(args.installationId);

    try {
      // Post a simple comment on the PR
      const comment = `🤖 **GitHub Code Reviewer**

Hello! I'm analyzing this pull request and will provide feedback soon.

**PR Summary:**
- **Title:** ${pullRequest.title}
- **Author:** @${pullRequest.author}
- **Branch:** ${pullRequest.headRef} → ${pullRequest.baseRef}
- **Status:** ${pullRequest.status}

✨ *This is an automated message from your friendly code reviewer bot!*`;

      const commentResponse = await octokit.rest.issues.createComment({
        owner: pullRequest.repository.owner,
        repo: pullRequest.repository.name,
        issue_number: pullRequest.number,
        body: comment,
      });

      console.log(
        `Posted comment on PR #${pullRequest.number}: ${commentResponse.data.html_url}`,
      );

      // Create a simple code review record
      await ctx.runMutation(internal.codereview.createCodeReview, {
        pullRequestId: args.pullRequestId,
        summary: `Automated review for PR #${pullRequest.number}: ${pullRequest.title}`,
        overallScore: 85, // Placeholder score
        githubCommentId: commentResponse.data.id,
      });

      // Update PR status
      await ctx.runMutation(internal.codereview.updatePullRequestStatus, {
        pullRequestId: args.pullRequestId,
        status: "completed",
      });

      console.log(`Code review completed for PR #${pullRequest.number}`);
    } catch (error) {
      console.error("Error processing pull request:", error);

      // Update PR status to error
      await ctx.runMutation(internal.codereview.updatePullRequestStatus, {
        pullRequestId: args.pullRequestId,
        status: "error",
      });

      throw error;
    }
  },
});

export const getPullRequestDetails = internalQuery({
  args: {
    pullRequestId: v.id("pullRequests"),
  },
  handler: async (ctx, args) => {
    const pullRequest = await ctx.db.get(args.pullRequestId);
    if (!pullRequest) {
      return null;
    }

    const repository = await ctx.db.get(pullRequest.repositoryId);
    if (!repository) {
      return null;
    }

    return {
      ...pullRequest,
      repository: {
        name: repository.name,
        fullName: repository.fullName,
        owner: repository.owner,
      },
    };
  },
});

export const createCodeReview = internalMutation({
  args: {
    pullRequestId: v.id("pullRequests"),
    summary: v.string(),
    overallScore: v.number(),
    githubCommentId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("codeReviews", {
      pullRequestId: args.pullRequestId,
      analysisResults: [], // Empty for now, will add real analysis later
      summary: args.summary,
      overallScore: args.overallScore,
      githubReviewId: args.githubCommentId,
      completedAt: Date.now(),
    });
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

// Public query to get code reviews for a PR (with access control)
export const getCodeReviewsForPullRequest = query({
  args: {
    pullRequestId: v.id("pullRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the user's GitHub ID
    const user = await ctx.db.get(userId);
    if (!user?.githubId) {
      return [];
    }

    // Get the pull request to check access
    const pullRequest = await ctx.db.get(args.pullRequestId);
    if (!pullRequest) {
      return [];
    }

    // Get the repository for this pull request
    const repository = await ctx.db.get(pullRequest.repositoryId);
    if (!repository) {
      return [];
    }

    // Get the installation for this repository
    const installation = await ctx.db.get(repository.installationId);
    if (!installation) {
      return [];
    }

    // Check if the user has access to this installation
    if (installation.accountId !== user.githubId) {
      return [];
    }

    // User has access, return the code reviews
    return await ctx.db
      .query("codeReviews")
      .withIndex("by_pull_request", (q) =>
        q.eq("pullRequestId", args.pullRequestId),
      )
      .collect();
  },
});

// Public query to get recent pull requests with their reviews (filtered by user access)
export const getRecentPullRequests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the user's GitHub ID
    const user = await ctx.db.get(userId);
    if (!user?.githubId) {
      return [];
    }

    const limit = args.limit || 10;

    // Get installations where the user is the account owner
    const installations = await ctx.db
      .query("installations")
      .filter((q) => q.eq(q.field("accountId"), user.githubId))
      .collect();

    if (installations.length === 0) {
      return [];
    }

    // Get all repositories from installations where the user has access
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

    // Get pull requests only from repositories the user has access to
    const allPullRequests = await ctx.db
      .query("pullRequests")
      .order("desc")
      .collect();

    const userPullRequests = allPullRequests
      .filter((pr) => userRepositoryIds.includes(pr.repositoryId))
      .slice(0, limit);

    const pullRequestsWithReviews = await Promise.all(
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

    return pullRequestsWithReviews;
  },
});
