import { Webhooks } from "@octokit/webhooks";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";

// GitHub webhook payload interfaces based on official documentation
interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner?: {
    login: string;
    id: number;
    type: string;
  };
  default_branch?: string;
  private: boolean;
  language?: string;
}

interface GitHubInstallation {
  id: number;
  account: {
    id: number;
    login: string;
    type: string;
  };
  permissions?: {
    contents?: string;
    metadata?: string;
    pull_requests?: string;
    checks?: string;
  };
  repository_selection?: string;
}

interface InstallationPayload {
  action: "created" | "deleted" | "suspend" | "unsuspend";
  installation: GitHubInstallation;
  repositories?: GitHubRepository[];
  sender: {
    login: string;
    id: number;
  };
}

interface InstallationRepositoriesPayload {
  action: "added" | "removed";
  installation: GitHubInstallation;
  repositories_added?: GitHubRepository[];
  repositories_removed?: GitHubRepository[];
  sender: {
    login: string;
    id: number;
  };
}

interface PullRequestPayload {
  action: "opened" | "closed" | "synchronize" | "reopened" | "edited";
  pull_request: {
    id: number;
    number: number;
    title: string;
    body?: string;
    user: {
      login: string;
      id: number;
    };
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
    html_url: string;
  };
  repository: GitHubRepository;
  installation?: GitHubInstallation;
  sender: {
    login: string;
    id: number;
  };
}

const webhooks = new Webhooks({
  secret: process.env.GITHUB_APP_WEBHOOK_SECRET!,
});

export const githubWebhook = httpAction(async (ctx, request) => {
  const body = await request.text();
  const signature = request.headers.get("X-Hub-Signature-256");
  const event = request.headers.get("X-GitHub-Event");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  if (!event) {
    return new Response("Missing event type", { status: 400 });
  }

  try {
    if (!webhooks.verify(body, signature)) {
      return new Response("Unauthorized", { status: 401 });
    }
  } catch (error) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body);
  } catch (error) {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    switch (event) {
      case "installation":
        await handleInstallation(ctx, payload as InstallationPayload);
        break;
      case "installation_repositories":
        await handleInstallationRepositories(
          ctx,
          payload as InstallationRepositoriesPayload,
        );
        break;
      case "pull_request":
        await handlePullRequest(ctx, payload as PullRequestPayload);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

async function handleInstallation(
  ctx: ActionCtx,
  payload: InstallationPayload,
) {
  console.log(`Installation event: ${payload.action}`);

  if (payload.action === "created") {
    const repositories =
      payload.repositories?.map((repo) => ({
        githubId: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner?.login || repo.full_name.split("/")[0] || "unknown",
        defaultBranch: repo.default_branch || "main",
        isPrivate: repo.private,
        language: repo.language,
      })) || [];

    await ctx.runMutation(api.github.saveInstallation, {
      githubInstallationId: payload.installation.id,
      accountId: payload.installation.account.id,
      accountLogin: payload.installation.account.login,
      accountType: payload.installation.account.type,
      permissions: {
        contents: payload.installation.permissions?.contents || "read",
        metadata: payload.installation.permissions?.metadata || "read",
        pullRequests:
          payload.installation.permissions?.pull_requests || "write",
        checks: payload.installation.permissions?.checks || "write",
      },
      repositorySelection:
        payload.installation.repository_selection || "selected",
      repositories,
    });

    console.log(
      `Installation ${payload.installation.id} created with ${repositories.length} repositories`,
    );
  } else if (payload.action === "deleted") {
    // App was uninstalled
    await ctx.runMutation(api.github.removeInstallation, {
      githubInstallationId: payload.installation.id,
    });

    console.log(`Installation ${payload.installation.id} deleted`);
  } else if (payload.action === "suspend") {
    // Installation was suspended
    console.log(`Installation ${payload.installation.id} suspended`);
  } else if (payload.action === "unsuspend") {
    // Installation was unsuspended
    console.log(`Installation ${payload.installation.id} unsuspended`);
  }
}

async function handleInstallationRepositories(
  ctx: ActionCtx,
  payload: InstallationRepositoriesPayload,
) {
  console.log(`Installation repositories event: ${payload.action}`);

  const repositoriesAdded = payload.repositories_added?.map((repo) => ({
    githubId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || repo.full_name.split("/")[0] || "unknown",
    defaultBranch: repo.default_branch || "main",
    isPrivate: repo.private,
    language: repo.language,
  }));

  const repositoriesRemoved = payload.repositories_removed?.map((repo) => ({
    githubId: repo.id,
  }));

  await ctx.runMutation(api.github.updateInstallationRepositories, {
    githubInstallationId: payload.installation.id,
    repositoriesAdded,
    repositoriesRemoved,
  });

  console.log(
    `Installation ${payload.installation.id} repositories updated - Added: ${repositoriesAdded?.length || 0}, Removed: ${repositoriesRemoved?.length || 0}`,
  );
}

async function handlePullRequest(ctx: ActionCtx, payload: PullRequestPayload) {
  console.log(
    `Pull request event: ${payload.action} - PR #${payload.pull_request.number}`,
  );

  if (
    payload.action === "opened" ||
    payload.action === "synchronize" ||
    payload.action === "reopened"
  ) {
    // Save/update the pull request
    const prId = await ctx.runMutation(api.github.savePullRequest, {
      githubId: payload.pull_request.id,
      repositoryGithubId: payload.repository.id,
      number: payload.pull_request.number,
      title: payload.pull_request.title,
      body: payload.pull_request.body,
      author: payload.pull_request.user.login,
      authorId: payload.pull_request.user.id,
      headRef: payload.pull_request.head.ref,
      baseRef: payload.pull_request.base.ref,
      headSha: payload.pull_request.head.sha,
      baseSha: payload.pull_request.base.sha,
      url: payload.pull_request.html_url,
    });

    console.log(`Pull request saved with ID: ${prId}`);

    // Trigger code review analysis
    if (payload.installation?.id) {
      await ctx.runAction(internal.codereview.processPullRequest, {
        pullRequestId: prId,
        installationId: payload.installation.id,
      });
      console.log(
        `Code review processing triggered for PR #${payload.pull_request.number}`,
      );
    } else {
      console.warn("No installation ID found in payload, skipping code review");
    }
  } else if (payload.action === "closed") {
    // Update PR status or handle cleanup
    console.log(`Pull request #${payload.pull_request.number} was closed`);
  }
}
