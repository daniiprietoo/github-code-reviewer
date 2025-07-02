import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  type QueryCtx,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { PULL_REQUEST_STATUS } from "./utils/constants";
import {
  createGitHubApp,
  getUserGitHubId,
  hasRepositoryAccess,
} from "./utils/github";
import type { PullRequest } from "./utils/validators";

export const processPullRequest = internalAction({
  args: {
    pullRequestId: v.id("pullRequests"),
    installationId: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`Processing pull request: ${args.pullRequestId}`);

    try {
      // Get pull request details
      const pullRequest = await ctx.runQuery(
        internal.codereview.getPullRequestDetails,
        { pullRequestId: args.pullRequestId },
      );

      if (!pullRequest) {
        throw new Error("Pull request not found");
      }

      // Update status to analyzing
      await ctx.runMutation(internal.pullrequests.updatePullRequestStatus, {
        pullRequestId: args.pullRequestId,
        status: PULL_REQUEST_STATUS.ANALYZING,
      });

      // Process the PR
      await processCodeReview(ctx, pullRequest, args.installationId);

      // Update status to completed
      await ctx.runMutation(internal.pullrequests.updatePullRequestStatus, {
        pullRequestId: args.pullRequestId,
        status: PULL_REQUEST_STATUS.COMPLETED,
      });

      console.log(`Code review completed for PR #${pullRequest.number}`);
    } catch (error) {
      console.error("Error processing pull request:", error);

      // Update PR status to error
      await ctx.runMutation(internal.pullrequests.updatePullRequestStatus, {
        pullRequestId: args.pullRequestId,
        status: PULL_REQUEST_STATUS.ERROR,
      });

      throw error;
    }
  },
});

async function processCodeReview(
  ctx: ActionCtx,
  pullRequest: NonNullable<Awaited<ReturnType<typeof getPullRequestDetails>>>,
  installationId: number,
) {
  const octokit = createGitHubApp(installationId);

  const comment = generateReviewComment(pullRequest);

  const commentResponse = await octokit.rest.issues.createComment({
    owner: pullRequest.repository.owner,
    repo: pullRequest.repository.name,
    issue_number: pullRequest.number,
    body: comment,
  });

  console.log(
    `Posted comment on PR #${pullRequest.number}: ${commentResponse.data.html_url}`,
  );

  // Create code review record
  await ctx.runMutation(internal.codereview.createCodeReview, {
    pullRequestId: pullRequest._id,
    summary: `Automated review for PR #${pullRequest.number}: ${pullRequest.title}`,
    overallScore: 85, // Placeholder score
    githubCommentId: commentResponse.data.id,
  });
}

function generateReviewComment(pullRequest: PullRequest): string {
  return `🤖 **GitHub Code Reviewer**

Hello! I'm analyzing this pull request and will provide feedback soon.

**PR Summary:**
- **Title:** ${pullRequest.title}
- **Author:** @${pullRequest.author}
- **Branch:** ${pullRequest.headRef} → ${pullRequest.baseRef}
- **Status:** ${pullRequest.status}

✨ *This is an automated message from your friendly code reviewer bot!*`;
}

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

// public query to get code reviews for a PR (with access control)
export const getCodeReviewsForPullRequest = query({
  args: {
    pullRequestId: v.id("pullRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the pull request to derive the repository ID
    const pullRequest = await ctx.db.get(args.pullRequestId);
    if (!pullRequest) {
      return [];
    }

    // Check if user has access to this repository using the actual repository ID
    const hasAccess = await hasRepositoryAccess(
      ctx.db,
      userId,
      pullRequest.repositoryId,
    );
    if (!hasAccess) {
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
