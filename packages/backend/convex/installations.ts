import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type DatabaseReader, type DatabaseWriter } from "./_generated/server";
import { DEFAULT_REPOSITORY_SETTINGS } from "./utils/constants";

interface RepositoryData {
  githubId: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
}

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
    // Check if installation already exists
    const existing = await getInstallationByGitHubId(
      ctx.db,
      args.githubInstallationId,
    );

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

    // Update repositories if provided
    if (args.repositories) {
      await replaceInstallationRepositories(
        ctx.db,
        installationId,
        args.repositories,
      );
    }

    return installationId;
  },
});

export const removeInstallation = mutation({
  args: {
    githubInstallationId: v.number(),
  },
  handler: async (ctx, args) => {
    const existingInstallation = await getInstallationByGitHubId(
      ctx.db,
      args.githubInstallationId,
    );

    if (existingInstallation) {
      await cleanupInstallationData(ctx.db, existingInstallation._id);
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
    const existingInstallation = await getInstallationByGitHubId(
      ctx.db,
      args.githubInstallationId,
    );

    if (!existingInstallation) {
      throw new Error("Installation not found");
    }

    // Add new repositories
    if (args.repositoriesAdded) {
      await addRepositoriesToInstallation(
        ctx.db,
        existingInstallation._id,
        args.repositoriesAdded,
      );
    }

    // Remove repositories
    if (args.repositoriesRemoved) {
      await removeRepositoriesFromInstallation(ctx.db, args.repositoriesRemoved);
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
    return await getInstallationByGitHubId(ctx.db, args.githubInstallationId);
  },
});

export const getUserInstallations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get the user's GitHub ID
    const user = await ctx.db.get(userId);
    if (!user?.githubId) {
      return [];
    }

    // Get installations where the user is the account owner
    const installations = await ctx.db
      .query("installations")
      .filter((q) => q.eq(q.field("accountId"), user.githubId))
      .collect();

    return await Promise.all(
      installations.map(async (installation) => {
        const repositories = await getRepositoriesByInstallation(
          ctx.db,
          installation._id,
        );
        return {
          ...installation,
          repositories,
        };
      }),
    );
  },
});

// Helper functions to reduce code duplication
async function getInstallationByGitHubId(
  db: DatabaseReader,
  githubInstallationId: number,
) {
  return await db
    .query("installations")
    .withIndex("by_installation_id", (q) =>
      q.eq("githubInstallationId", githubInstallationId),
    )
    .first();
}

async function getRepositoriesByInstallation(
  db: DatabaseReader,
  installationId: Id<"installations">,
) {
  return await db
    .query("repositories")
    .withIndex("by_installation", (q) =>
      q.eq("installationId", installationId),
    )
    .collect();
}

async function replaceInstallationRepositories(
  db: DatabaseWriter,
  installationId: Id<"installations">,
  repositories: RepositoryData[],
) {
  // Remove existing repositories
  const existingRepos = await getRepositoriesByInstallation(
    db,
    installationId,
  );
  for (const repo of existingRepos) {
    await db.delete(repo._id);
  }

  // Insert new repositories
  for (const repo of repositories) {
    await insertRepository(db, installationId, repo);
  }
}

async function addRepositoriesToInstallation(
  db: DatabaseWriter,
  installationId: Id<"installations">,
  repositories: RepositoryData[],
) {
  for (const repo of repositories) {
    // Check if repository already exists
    const existingRepo = await db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
      .first();

    if (!existingRepo) {
      await insertRepository(db, installationId, repo);
    }
  }
}

async function removeRepositoriesFromInstallation(
  db: DatabaseWriter,
  repositories: { githubId: number }[],
) {
  for (const repo of repositories) {
    const existingRepo = await db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
      .first();

    if (existingRepo) {
      await cleanupRepositoryData(db, existingRepo._id);
      await db.delete(existingRepo._id);
    }
  }
}

async function insertRepository(
  db: DatabaseWriter,
  installationId: Id<"installations">,
  repo: RepositoryData,
) {
  await db.insert("repositories", {
    githubId: repo.githubId,
    installationId,
    name: repo.name,
    fullName: repo.fullName,
    owner: repo.owner,
    defaultBranch: repo.defaultBranch,
    isPrivate: repo.isPrivate,
    language: repo.language,
    isActive: true,
    settings: DEFAULT_REPOSITORY_SETTINGS,
    createdAt: Date.now(),
  });
}

async function cleanupInstallationData(
  db: DatabaseWriter,
  installationId: Id<"installations">,
) {
  const repositories = await getRepositoriesByInstallation(db, installationId);

  for (const repo of repositories) {
    await cleanupRepositoryData(db, repo._id);
    await db.delete(repo._id);
  }
}

async function cleanupRepositoryData(
  db: DatabaseWriter,
  repositoryId: Id<"repositories">,
) {
  // Delete all pull requests for this repository
  const pullRequests = await db
    .query("pullRequests")
    .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
    .collect();

  for (const pr of pullRequests) {
    // Delete code reviews for this PR
    const reviews = await db
      .query("codeReviews")
      .withIndex("by_pull_request", (q) => q.eq("pullRequestId", pr._id))
      .collect();

    for (const review of reviews) {
      await db.delete(review._id);
    }

    await db.delete(pr._id);
  }
}
