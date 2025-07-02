import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import type { Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import { env } from "../env";

/**
 * Creates a GitHub App authenticated Octokit instance
 */
export function createGitHubApp(installationId: number): Octokit {
  let privateKey = env.GITHUB_APP_PRIVATE_KEY;

  // Handle escaped newlines and format the private key properly
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Ensure the private key has proper PEM format
  if (!privateKey.includes("-----BEGIN")) {
    throw new Error("GitHub App private key must be in PEM format");
  }

  // Clean up any extra whitespace and ensure proper line endings
  privateKey = privateKey.trim();

  try {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: Number(env.GITHUB_APP_ID),
        privateKey,
        installationId,
      },
    });
  } catch (error) {
    console.error("Failed to create GitHub App instance:", error);
    console.error("App ID:", env.GITHUB_APP_ID);
    console.error("Installation ID:", installationId);
    console.error(
      "Private key starts with:",
      `${privateKey.substring(0, 50)}...`,
    );
    throw new Error(
      `GitHub App authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Gets user's GitHub ID from auth accounts
 */
export async function getUserGitHubId(
  db: DatabaseReader,
  userId: Id<"users">,
): Promise<number | null> {
  const githubAccount = await db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) =>
      q.eq("userId", userId).eq("provider", "github"),
    )
    .first();

  return githubAccount ? Number(githubAccount.providerAccountId) : null;
}

/**
 * Gets user's installations with access control
 */
export async function getUserInstallationIds(
  db: DatabaseReader,
  githubId: number,
): Promise<Id<"installations">[]> {
  const installations = await db
    .query("installations")
    .filter((q) => q.eq(q.field("accountId"), githubId))
    .collect();

  return installations.map((installation) => installation._id);
}

/**
 * Checks if user has access to a repository
 */
export async function hasRepositoryAccess(
  db: DatabaseReader,
  userId: Id<"users">,
  repositoryId: Id<"repositories">,
): Promise<boolean> {
  const githubId = await getUserGitHubId(db, userId);
  if (!githubId) return false;

  const repository = await db.get(repositoryId);
  if (!repository) return false;

  const installation = await db.get(repository.installationId);
  if (!installation) return false;

  return installation.accountId === githubId;
}

/**
 * Transforms GitHub repository data to our format
 */
export function transformRepositoryData(repo: {
  id: number;
  name: string;
  full_name: string;
  owner?: { login: string };
  default_branch?: string;
  private: boolean;
  language?: string;
}) {
  return {
    githubId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || repo.full_name.split("/")[0] || "unknown",
    defaultBranch: repo.default_branch || "main",
    isPrivate: repo.private,
    language: repo.language,
  };
}
