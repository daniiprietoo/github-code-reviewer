import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const saveInstallation = mutation({
  args: {
    githubInstallationId: v.number(),
    accountId: v.number(),
    accountLogin: v.string(),
    accountType: v.string(),
    permissions: v.object({
      contents: v.string(),
      metadata: v.string(),
      pullRequests: v.string(),
      checks: v.string(),
    }),
    repositorySelection: v.string(),
    repositories: v.optional(
      v.array(
        v.object({
          githubId: v.number(),
          name: v.string(),
          fullName: v.string(),
          owner: v.string(),
          defaultBranch: v.string(),
          isPrivate: v.boolean(),
          language: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Check if the installation already exists
    const existing = await ctx.db
      .query("installations")
      .withIndex("by_installation_id", (q) =>
        q.eq("githubInstallationId", args.githubInstallationId),
      )
      .first();

    const installationData = {
      githubInstallationId: args.githubInstallationId,
      accountId: args.accountId,
      accountLogin: args.accountLogin,
      accountType: args.accountType,
      permissions: args.permissions,
      repositorySelection: args.repositorySelection,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Insert or update the installation
    let installationId: Id<"installations">;
    if (existing) {
      await ctx.db.patch(existing._id, installationData);
      installationId = existing._id;
    } else {
      installationId = await ctx.db.insert("installations", installationData);
    }

    // Insert or update repositories
    if (args.repositories) {
      const existingRepos = await ctx.db
        .query("repositories")
        .withIndex("by_installation", (q) =>
          q.eq("installationId", installationId),
        )
        .collect();

      for (const repo of existingRepos) {
        await ctx.db.delete(repo._id);
      }

      for (const repo of args.repositories) {
        await ctx.db.insert("repositories", {
          githubId: repo.githubId,
          installationId,
          name: repo.name,
          fullName: repo.fullName,
          owner: repo.owner,
          defaultBranch: repo.defaultBranch,
          isPrivate: repo.isPrivate,
          language: repo.language,
          isActive: true,
          settings: {
            enableStyleChecks: true,
            enableSecurityChecks: true,
            enablePerformanceChecks: true,
            minSeverity: "medium",
            excludePatterns: [],
            customRules: [],
          },
          createdAt: Date.now(),
        });
      }
    }

    return installationId;
  },
});

export const removeInstallation = mutation({
  args: {
    githubInstallationId: v.number(),
  },

  handler: async (ctx, args) => {
    const existingInstallation = await ctx.db
      .query("installations")
      .withIndex("by_installation_id", (q) =>
        q.eq("githubInstallationId", args.githubInstallationId),
      )
      .first();

    if (existingInstallation) {
      const repositories = await ctx.db
        .query("repositories")
        .withIndex("by_installation", (q) =>
          q.eq("installationId", existingInstallation._id),
        )
        .collect();

      for (const repo of repositories) {
        // Delete all pull requests for this repository
        const pullRequests = await ctx.db
          .query("pullRequests")
          .withIndex("by_repository", (q) => q.eq("repositoryId", repo._id))
          .collect();

        for (const pr of pullRequests) {
          // Delete code reviews for this PR
          const reviews = await ctx.db
            .query("codeReviews")
            .withIndex("by_pull_request", (q) => q.eq("pullRequestId", pr._id))
            .collect();

          for (const review of reviews) {
            await ctx.db.delete(review._id);
          }

          await ctx.db.delete(pr._id);
        }

        await ctx.db.delete(repo._id);
      }

      await ctx.db.delete(existingInstallation._id);
    }
  },
});

export const updateInstallationRepositories = mutation({
  args: {
    githubInstallationId: v.number(),
    repositoriesAdded: v.optional(
      v.array(
        v.object({
          githubId: v.number(),
          name: v.string(),
          fullName: v.string(),
          owner: v.string(),
          defaultBranch: v.string(),
          isPrivate: v.boolean(),
          language: v.optional(v.string()),
        }),
      ),
    ),
    repositoriesRemoved: v.optional(
      v.array(
        v.object({
          githubId: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existingInstallation = await ctx.db
      .query("installations")
      .withIndex("by_installation_id", (q) =>
        q.eq("githubInstallationId", args.githubInstallationId),
      )
      .first();

    if (!existingInstallation) {
      throw new Error("Installation not found");
    }

    if (args.repositoriesAdded) {
      for (const repo of args.repositoriesAdded) {
        // Check if repository already exists
        const existingRepo = await ctx.db
          .query("repositories")
          .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
          .first();

        if (!existingRepo) {
          await ctx.db.insert("repositories", {
            githubId: repo.githubId,
            installationId: existingInstallation._id,
            name: repo.name,
            fullName: repo.fullName,
            owner: repo.owner,
            defaultBranch: repo.defaultBranch,
            isPrivate: repo.isPrivate,
            language: repo.language,
            isActive: true,
            settings: {
              enableStyleChecks: true,
              enableSecurityChecks: true,
              enablePerformanceChecks: true,
              minSeverity: "medium",
              excludePatterns: [],
              customRules: [],
            },
            createdAt: Date.now(),
          });
        }
      }
    }

    if (args.repositoriesRemoved) {
      for (const repo of args.repositoriesRemoved) {
        const existingRepo = await ctx.db
          .query("repositories")
          .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
          .first();

        if (existingRepo) {
          // Delete all pull requests and reviews for this repository
          const pullRequests = await ctx.db
            .query("pullRequests")
            .withIndex("by_repository", (q) =>
              q.eq("repositoryId", existingRepo._id),
            )
            .collect();

          for (const pr of pullRequests) {
            const reviews = await ctx.db
              .query("codeReviews")
              .withIndex("by_pull_request", (q) =>
                q.eq("pullRequestId", pr._id),
              )
              .collect();

            for (const review of reviews) {
              await ctx.db.delete(review._id);
            }

            await ctx.db.delete(pr._id);
          }

          await ctx.db.delete(existingRepo._id);
        }
      }
    }

    // Update installation timestamp
    await ctx.db.patch(existingInstallation._id, {
      updatedAt: Date.now(),
    });
  },
});

export const getInstallation = query({
  args: {
    githubInstallationId: v.number(),
  },
  handler: async (ctx, args) => {
    const existingInstallation = await ctx.db
      .query("installations")
      .withIndex("by_installation_id", (q) =>
        q.eq("githubInstallationId", args.githubInstallationId),
      )
      .first();

    if (!existingInstallation) {
      return null;
    }

    return existingInstallation;
  },
});

export const getUserInstallations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // return all installations for the user
    const installations = await ctx.db.query("installations").collect();

    const installationsWithRepos = await Promise.all(
      installations.map(async (installation) => {
        const repositories = await ctx.db
          .query("repositories")
          .withIndex("by_installation", (q) =>
            q.eq("installationId", installation._id),
          )
          .collect();

        return {
          ...installation,
          repositories,
        };
      }),
    );

    return installationsWithRepos;
  },
});

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

    // Get all repositories from installations where the user has access
    const repositories = await ctx.db.query("repositories").collect();
    return repositories;
  },
});

export const getCurrentUserGitHubId = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get GitHub account from authAccounts table
    const githubAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "github"),
      )
      .first();

    if (!githubAccount) {
      return null;
    }

    // The GitHub user ID is stored in the providerAccountId field
    return Number(githubAccount.providerAccountId);
  },
});

export const updateUserGitHubId = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get GitHub account from authAccounts table
    const githubAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "github"),
      )
      .first();

    if (!githubAccount) {
      throw new Error("GitHub account not found");
    }

    const githubId = Number(githubAccount.providerAccountId);

    // Update the user record with the GitHub ID
    await ctx.db.patch(userId, { githubId });

    return githubId;
  },
});

export const savePullRequest = mutation({
  args: {
    githubId: v.number(),
    repositoryGithubId: v.number(),
    number: v.number(),
    title: v.string(),
    body: v.optional(v.string()),
    author: v.string(),
    authorId: v.number(),
    headRef: v.string(),
    baseRef: v.string(),
    headSha: v.string(),
    baseSha: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the repository
    const repository = await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) =>
        q.eq("githubId", args.repositoryGithubId),
      )
      .first();

    if (!repository) {
      throw new Error("Repository not found");
    }

    // Check if PR already exists
    const existingPR = await ctx.db
      .query("pullRequests")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    const prData = {
      githubId: args.githubId,
      repositoryId: repository._id,
      number: args.number,
      title: args.title,
      body: args.body,
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
