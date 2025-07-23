import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import {
  CODE_REVIEW_SCHEMA,
  type AIConfig,
  type CodeReviewOutputSchema,
  type CodeReviewRequest,
} from "../utils/validators";


export const testAIConnection = action({
  args: {
    provider: v.union(v.literal("openrouter"), v.literal("openrouter-free")),
    apiKey: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!args.model) {
        throw new Error("Model is required");
      }

      const response = await generateText({
        model: openrouter(args.apiKey, {
          models: [args.model],
        }),
        prompt: "Test connection. Please respond with 'OK' if you can read this.",
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

async function buildCodeReviewPrompt(
  request: CodeReviewRequest,
): Promise<string> {
  return `You are an expert code reviewer. Analyze this pull request and provide a comprehensive review focusing on code quality, security, performance, and best practices.

**Pull Request Details:**
Title: ${request.pullRequestTitle}
${request.pullRequestBody ? `Description: ${request.pullRequestBody}` : ""}

**Files Changed:**
${request.files
  .map((file) => `- ${file.filename} (+${file.additions}/-${file.deletions})`)
  .join("\n")}

**Diff Content:**
\`\`\`diff
${request.diffContent}
\`\`\`

Please analyze the code changes and provide:

1. **Summary**: Brief overview of what was changed and overall quality assessment
2. **Overall Score**: Rate the code quality from 0-100 considering:
   - Code correctness and functionality
   - Security considerations
   - Performance implications  
   - Code maintainability and readability
   - Best practices adherence
   - Testing coverage (if applicable)

3. **Findings**: Specific issues, improvements, or praise with:
   - Type: "issue" (problems to fix), "improvement" (suggestions), or "praise" (good practices)
   - Severity: "high" (critical), "medium" (important), or "low" (minor)
   - Clear explanation with context
   - File and line references when possible

4. **Suggestions**: Actionable recommendations for improvement

Be constructive, specific, and focus on the most impactful feedback.`;
}

function getOpenRouterProvider(apiKey: string) {
  return createOpenRouter({
    apiKey,
  });
}

async function callOpenRouterStructured(
  prompt: string,
  aiconfig: AIConfig,
  options: { maxTokens?: number; temperature?: number },
): Promise<CodeReviewOutputSchema> {

  if (!aiconfig.model) {
    throw new Error("Model is required");
  }

  const openrouter = getOpenRouterProvider(aiconfig.apiKey);

  const response = await generateObject({
    model: openrouter.chat(aiconfig.model),
    schema: CODE_REVIEW_SCHEMA,
    schemaName: "code_review",
    schemaDescription: "A detailed code review of the changes",
    prompt,
    system:
      "You are an expert code reviewer. Analyze code changes and provide structured feedback.",
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.3,
  });

  console.log(response.object);
  console.log(response.usage);

  return response.object;
}

// Internal action to generate AI code review
export const generateAICodeReview = internalAction({
  args: {
    userId: v.id("users"),
    pullRequestData: v.object({
      title: v.string(),
      body: v.optional(v.string()),
      diffContent: v.string(),
      files: v.array(
        v.object({
          filename: v.string(),
          patch: v.optional(v.string()),
          additions: v.number(),
          deletions: v.number(),
        }),
      ),
    }),
  },
  handler: async (ctx, args): Promise<CodeReviewOutputSchema> => {
    // Get user's AI configuration
    const config = await ctx.runQuery(
      internal.openrouter.aiconfig.getUserAIConfigInternal,
      {
        userId: args.userId,
      },
    );

    if (!config) {
      throw new Error("User has not configured AI settings");
    }

    // For openrouter-free, we need to provide a system API key since user doesn't have one
    if (config.provider === "openrouter-free") {
      const { env } = await import("../env");
      config.apiKey = env.OPENROUTER_API_KEY;
    }

    if (!config.apiKey) {
      throw new Error("No API key available for AI analysis");
    }

    const prompt = await buildCodeReviewPrompt({
      pullRequestTitle: args.pullRequestData.title,
      pullRequestBody: args.pullRequestData.body,
      diffContent: args.pullRequestData.diffContent,
      files: args.pullRequestData.files,
    });

    try {
    return await callOpenRouterStructured(prompt, config, {
        maxTokens: 2000,
        temperature: 0.3,
      });
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error(`No object generated from OpenRouter: ${error.cause}`);
      }
      throw new Error(
        `Unknown error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});
