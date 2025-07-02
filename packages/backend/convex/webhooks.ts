import { Webhooks } from "@octokit/webhooks";
import { api, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { env } from "./env";
import {
  GITHUB_EVENTS,
  INSTALLATION_ACTIONS,
  PULL_REQUEST_ACTIONS,
  REPOSITORY_PERMISSIONS,
} from "./utils/constants";
import { transformRepositoryData } from "./utils/github";

// GitHub webhook payload interfaces
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

interface BaseWebhookPayload {
  sender: {
    login: string;
    id: number;
  };
}

interface InstallationPayload extends BaseWebhookPayload {
  action: "created" | "deleted" | "suspend" | "unsuspend";
  installation: GitHubInstallation;
  repositories?: GitHubRepository[];
}

interface InstallationRepositoriesPayload extends BaseWebhookPayload {
  action: "added" | "removed";
  installation: GitHubInstallation;
  repositories_added?: GitHubRepository[];
  repositories_removed?: GitHubRepository[];
}

interface PullRequestPayload extends BaseWebhookPayload {
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
}

const webhooks = new Webhooks({
  secret: env.GITHUB_APP_WEBHOOK_SECRET,
});

export const githubWebhook = httpAction(async (ctx, request) => {
  const validationResult = await validateWebhookRequest(request);
  if (!validationResult.isValid) {
    return new Response(validationResult.error, {
      status: validationResult.status,
    });
  }

  const { body, event } = validationResult;

  if (!body) {
    return new Response("Missing body", { status: 400 });
  }

  try {
    const payload = JSON.parse(body);
    await routeWebhookEvent(ctx, event, payload);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

async function validateWebhookRequest(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("X-Hub-Signature-256");
  const event = request.headers.get("X-GitHub-Event");

  if (!signature) {
    return { isValid: false, error: "Missing signature", status: 400 };
  }

  if (!event) {
    return { isValid: false, error: "Missing event type", status: 400 };
  }

  if (!body) {
    return { isValid: false, error: "Missing body", status: 400 };
  }

  try {
    if (!webhooks.verify(body, signature)) {
      return { isValid: false, error: "Unauthorized", status: 401 };
    }
  } catch (error) {
    return { isValid: false, error: "Unauthorized", status: 401 };
  }

  return { isValid: true, body, event: event as string };
}

async function routeWebhookEvent(
  ctx: ActionCtx,
  event: string,
  payload: unknown,
) {
  switch (event) {
    case GITHUB_EVENTS.INSTALLATION:
      await handleInstallation(ctx, payload as InstallationPayload);
      break;
    case GITHUB_EVENTS.INSTALLATION_REPOSITORIES:
      await handleInstallationRepositories(
        ctx,
        payload as InstallationRepositoriesPayload,
      );
      break;
    case GITHUB_EVENTS.PULL_REQUEST:
      await handlePullRequest(ctx, payload as PullRequestPayload);
      break;
    default:
      console.log(`Unhandled event type: ${event}`);
  }
}

async function handleInstallation(
  ctx: ActionCtx,
  payload: InstallationPayload,
) {
  console.log(`Installation event: ${payload.action}`);

  switch (payload.action) {
    case INSTALLATION_ACTIONS.CREATED:
      await createInstallation(ctx, payload);
      break;
    case INSTALLATION_ACTIONS.DELETED:
      await deleteInstallation(ctx, payload);
      break;
    case INSTALLATION_ACTIONS.SUSPEND:
      console.log(`Installation ${payload.installation.id} suspended`);
      break;
    case INSTALLATION_ACTIONS.UNSUSPEND:
      console.log(`Installation ${payload.installation.id} unsuspended`);
      break;
  }
}

async function createInstallation(
  ctx: ActionCtx,
  payload: InstallationPayload,
) {
  const repositories = payload.repositories?.map(transformRepositoryData) || [];

  await ctx.runMutation(api.installations.saveInstallation, {
    githubInstallationId: payload.installation.id,
    accountId: payload.installation.account.id,
    accountLogin: payload.installation.account.login,
    accountType: payload.installation.account.type,
    permissions: normalizePermissions(payload.installation.permissions),
    repositorySelection:
      payload.installation.repository_selection || "selected",
    repositories,
  });

  console.log(
    `Installation ${payload.installation.id} created with ${repositories.length} repositories`,
  );
}

async function deleteInstallation(
  ctx: ActionCtx,
  payload: InstallationPayload,
) {
  await ctx.runMutation(api.installations.removeInstallation, {
    githubInstallationId: payload.installation.id,
  });

  console.log(`Installation ${payload.installation.id} deleted`);
}

function normalizePermissions(permissions?: GitHubInstallation["permissions"]) {
  return {
    contents: permissions?.contents || REPOSITORY_PERMISSIONS.READ,
    metadata: permissions?.metadata || REPOSITORY_PERMISSIONS.READ,
    pullRequests: permissions?.pull_requests || REPOSITORY_PERMISSIONS.WRITE,
    checks: permissions?.checks || REPOSITORY_PERMISSIONS.WRITE,
  };
}

async function handleInstallationRepositories(
  ctx: ActionCtx,
  payload: InstallationRepositoriesPayload,
) {
  console.log(`Installation repositories event: ${payload.action}`);

  const repositoriesAdded = payload.repositories_added?.map(
    transformRepositoryData,
  );
  const repositoriesRemoved = payload.repositories_removed?.map((repo) => ({
    githubId: repo.id,
  }));

  await ctx.runMutation(api.installations.updateInstallationRepositories, {
    githubInstallationId: payload.installation.id,
    repositoriesAdded,
    repositoriesRemoved,
  });

  console.log(
    `Installation ${payload.installation.id} repositories updated - Added: ${
      repositoriesAdded?.length || 0
    }, Removed: ${repositoriesRemoved?.length || 0}`,
  );
}

async function handlePullRequest(ctx: ActionCtx, payload: PullRequestPayload) {
  console.log(
    `Pull request event: ${payload.action} - PR #${payload.pull_request.number}`,
  );

  if (shouldProcessPullRequest(payload.action)) {
    await processPullRequestEvent(ctx, payload);
  } else if (payload.action === PULL_REQUEST_ACTIONS.CLOSED) {
    console.log(`Pull request #${payload.pull_request.number} was closed`);
    // Could add cleanup logic here if needed
  }
}

function shouldProcessPullRequest(action: string): boolean {
  const processableActions = [
    PULL_REQUEST_ACTIONS.OPENED,
    PULL_REQUEST_ACTIONS.SYNCHRONIZE,
    PULL_REQUEST_ACTIONS.REOPENED,
  ] as readonly string[];

  return processableActions.includes(action);
}

async function processPullRequestEvent(
  ctx: ActionCtx,
  payload: PullRequestPayload,
) {
  // Save/update the pull request
  const prId = await ctx.runMutation(api.pullrequests.savePullRequest, {
    githubId: payload.pull_request.id,
    repositoryGithubId: payload.repository.id,
    number: payload.pull_request.number,
    title: payload.pull_request.title,
    body: payload.pull_request.body || null,
    author: payload.pull_request.user.login,
    authorId: payload.pull_request.user.id,
    headRef: payload.pull_request.head.ref,
    baseRef: payload.pull_request.base.ref,
    headSha: payload.pull_request.head.sha,
    baseSha: payload.pull_request.base.sha,
    url: payload.pull_request.html_url,
  });

  console.log(`Pull request saved with ID: ${prId}`);

  // Trigger code review analysis if installation is available
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
}
