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
import type { CodeReviewResponse } from "./ai";
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

  try {
    // Get repository data to find the owner user
    const repository = await ctx.runQuery(
      internal.codereview.getRepositoryOwner,
      {
        repositoryId: pullRequest.repositoryId,
      },
    );

    if (!repository) {
      throw new Error("Repository not found");
    }

    // Try to get AI analysis
    let aiReview: CodeReviewResponse | null = null;
    try {
      // Get PR diff content
      const diffResponse = await octokit.rest.pulls.get({
        owner: pullRequest.repository.owner,
        repo: pullRequest.repository.name,
        pull_number: pullRequest.number,
        mediaType: {
          format: "diff",
        },
      });

      // Get PR files
      const filesResponse = await octokit.rest.pulls.listFiles({
        owner: pullRequest.repository.owner,
        repo: pullRequest.repository.name,
        pull_number: pullRequest.number,
      });

      aiReview = await ctx.runAction(internal.ai.generateAICodeReview, {
        userId: repository.ownerUserId,
        pullRequestData: {
          title: pullRequest.title,
          body: pullRequest.body || undefined,
          diffContent: diffResponse.data as unknown as string,
          files: filesResponse.data.map((file) => ({
            filename: file.filename,
            patch: file.patch || undefined,
            additions: file.additions,
            deletions: file.deletions,
          })),
        },
      });

      console.log("AI review generated successfully");
    } catch (error) {
      console.error("AI review failed, falling back to basic comment:", error);
      // Continue with basic comment if AI fails
    }

    // Generate comment based on AI review or fallback
    const comment = aiReview
      ? generateAIReviewComment(pullRequest, aiReview)
      : generateFallbackComment(pullRequest);

    const commentResponse = await octokit.rest.issues.createComment({
      owner: pullRequest.repository.owner,
      repo: pullRequest.repository.name,
      issue_number: pullRequest.number,
      body: comment,
    });

    console.log(
      `Posted comment on PR #${pullRequest.number}: ${commentResponse.data.html_url}`,
    );

    // Create code review record with AI results
    await ctx.runMutation(internal.codereview.createCodeReview, {
      pullRequestId: pullRequest._id,
      summary:
        aiReview?.summary ||
        `Automated review for PR #${pullRequest.number}: ${pullRequest.title}`,
      overallScore: aiReview?.overallScore || 50,
      githubCommentId: commentResponse.data.id,
      analysisResults:
        aiReview?.findings.map((finding) => ({
          file: finding.file || "",
          line: finding.line,
          endLine: finding.line,
          severity: finding.severity,
          category:
            finding.type === "issue"
              ? "bug"
              : finding.type === "improvement"
                ? "style"
                : "general",
          ruleId: "ai-review",
          message: finding.message,
          suggestion: undefined,
          confidence: 0.8,
        })) || [],
    });
  } catch (error) {
    console.error("Error in processCodeReview:", error);
    throw error;
  }
}

function generateAIReviewComment(
  pullRequest: PullRequest,
  aiReview: CodeReviewResponse,
): string {
  const findingsByType = aiReview.findings.reduce(
    (acc, finding) => {
      if (!acc[finding.type]) acc[finding.type] = [];
      acc[finding.type]!.push(finding);
      return acc;
    },
    {} as Record<string, typeof aiReview.findings>,
  );

  let comment = `🤖 **AI Code Review**

**Overall Score: ${aiReview.overallScore}/100**

${aiReview.summary}

`;

  // Add findings by type
  if (findingsByType.issue?.length) {
    comment += "## 🚨 Issues Found\n";
    findingsByType.issue.forEach((finding) => {
      const location = finding.file
        ? ` \`${finding.file}${finding.line ? `:${finding.line}` : ""}\``
        : "";
      comment += `- **${finding.severity.toUpperCase()}:**${location} ${finding.message}\n`;
    });
    comment += "\n";
  }

  if (findingsByType.improvement?.length) {
    comment += "## 💡 Suggestions for Improvement\n";
    findingsByType.improvement.forEach((finding) => {
      const location = finding.file
        ? ` \`${finding.file}${finding.line ? `:${finding.line}` : ""}\``
        : "";
      comment += `- **SUGGESTION:**${location} ${finding.message}\n`;
    });
    comment += "\n";
  }

  if (findingsByType.praise?.length) {
    comment += "## ✅ Good Practices Found\n";
    findingsByType.praise.forEach((finding) => {
      const location = finding.file
        ? ` \`${finding.file}${finding.line ? `:${finding.line}` : ""}\``
        : "";
      comment += `- **GOOD:**${location} ${finding.message}\n`;
    });
    comment += "\n";
  }

  if (aiReview.suggestions.length) {
    comment += "## 📋 General Recommendations\n";
    aiReview.suggestions.forEach((suggestion) => {
      comment += `- ${suggestion}\n`;
    });
    comment += "\n";
  }

  comment += `---
*🤖 This review was generated automatically using AI. Results may vary and should be validated by human reviewers.*`;

  return comment;
}

function generateFallbackComment(pullRequest: PullRequest): string {
  return `🤖 **GitHub Code Reviewer**

Hello! I attempted to analyze this pull request but AI review is not configured or failed.

**PR Summary:**
- **Title:** ${pullRequest.title}
- **Author:** @${pullRequest.author}
- **Branch:** ${pullRequest.headRef} → ${pullRequest.baseRef}
- **Status:** ${pullRequest.status}

To enable AI-powered reviews, please configure your AI settings in the dashboard.

✨ *This is an automated message from your GitHub Code Reviewer bot!*`;
}

export const createCodeReview = internalMutation({
  args: {
    pullRequestId: v.id("pullRequests"),
    summary: v.string(),
    overallScore: v.number(),
    githubCommentId: v.optional(v.number()),
    analysisResults: v.optional(
      v.array(
        v.object({
          file: v.string(),
          line: v.optional(v.number()),
          endLine: v.optional(v.number()),
          severity: v.string(),
          category: v.string(),
          ruleId: v.string(),
          message: v.string(),
          suggestion: v.optional(v.string()),
          confidence: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("codeReviews", {
      pullRequestId: args.pullRequestId,
      analysisResults: args.analysisResults || [],
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

export const getRepositoryOwner = internalQuery({
  args: {
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) {
      return null;
    }

    const installation = await ctx.db.get(repository.installationId);
    if (!installation) {
      return null;
    }

    // Find the user who owns this installation
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("githubId"), installation.accountId))
      .first();

    if (!user) {
      return null;
    }

    return {
      ownerUserId: user._id,
      installation,
      repository,
    };
  },
});
