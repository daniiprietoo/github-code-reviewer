import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth fields
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),

    // custom fields
    githubId: v.optional(v.number()),
    accessToken: v.optional(v.string()), // Encrypted
    username: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  }).index("email", ["email"]),

  installations: defineTable({
    githubInstallationId: v.number(),
    accountId: v.number(),
    accountLogin: v.string(),
    accountType: v.string(), // "User" | "Organization"
    permissions: v.object({
      contents: v.string(),
      metadata: v.string(),
      pullRequests: v.string(),
      checks: v.string(),
    }),
    repositorySelection: v.string(), // "all" | "selected"
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_installation_id", ["githubInstallationId"]),

  repositories: defineTable({
    githubId: v.number(),
    installationId: v.id("installations"),
    name: v.string(),
    fullName: v.string(),
    owner: v.string(),
    defaultBranch: v.string(),
    isPrivate: v.boolean(),
    language: v.optional(v.string()),
    isActive: v.boolean(),
    settings: v.object({
      enableStyleChecks: v.boolean(),
      enableSecurityChecks: v.boolean(),
      enablePerformanceChecks: v.boolean(),
      minSeverity: v.string(),
      excludePatterns: v.array(v.string()),
      customRules: v.array(v.string()),
    }),
    createdAt: v.number(),
  })
    .index("by_github_id", ["githubId"])
    .index("by_installation", ["installationId"]),

  pullRequests: defineTable({
    githubId: v.number(),
    repositoryId: v.id("repositories"),
    number: v.number(),
    title: v.string(),
    body: v.optional(v.string()),
    author: v.string(),
    authorId: v.number(),
    headRef: v.string(),
    baseRef: v.string(),
    headSha: v.string(),
    baseSha: v.string(),
    status: v.string(), // "pending" | "analyzing" | "completed" | "error"
    url: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_github_id", ["githubId"])
    .index("by_repository", ["repositoryId"])
    .index("by_created_at", ["createdAt"])
    .index("by_repository_and_created_at", ["repositoryId", "createdAt"]),

  codeReviews: defineTable({
    pullRequestId: v.id("pullRequests"),
    analysisResults: v.array(
      v.object({
        file: v.string(),
        line: v.optional(v.number()),
        endLine: v.optional(v.number()),
        severity: v.string(), // "low" | "medium" | "high"
        category: v.string(), // "bug" | "security" | "style" | "performance"
        ruleId: v.string(),
        message: v.string(),
        suggestion: v.optional(v.string()),
        confidence: v.number(), // 0-1
      }),
    ),
    summary: v.string(),
    overallScore: v.number(), // 0-100
    githubReviewId: v.optional(v.number()),
    completedAt: v.number(),
  }).index("by_pull_request", ["pullRequestId"]),

  aiConfigurations: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("openrouter"), v.literal("openrouter-free")),
    apiKey: v.optional(v.string()), // Should be encrypted in production
    model: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
