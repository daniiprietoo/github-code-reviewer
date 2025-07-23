import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";
import { NoObjectGeneratedError, generateObject, generateText } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import {
  type AIConfig,
  CODE_REVIEW_SCHEMA,
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
        prompt:
          "Test connection. Please respond with 'OK' if you can read this.",
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

  // Increase token limits and add retry logic
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await generateObject({
        model: openrouter.chat(aiconfig.model),
        schema: CODE_REVIEW_SCHEMA,
        schemaName: "code_review",
        schemaDescription:
          "A detailed code review with summary, score, findings, and suggestions",
        prompt,
        system: `You are an expert code reviewer. Analyze code changes and provide structured feedback in valid JSON format.

CRITICAL: Your response must be a complete, valid JSON object with ALL required fields:
{
  "summary": "string - brief overview",
  "overallScore": number (0-100),
  "findings": [...],
  "suggestions": [...]
}

Do not truncate or omit any required fields.`,
        maxTokens: options.maxTokens ?? 4000, // Increased from 2000
        temperature: options.temperature ?? 0.3,
      });

      console.log("AI review generated successfully:", {
        hasObject: !!response.object,
        usage: response.usage,
        attempt,
      });

      // Validate the response has all required fields
      if (
        !response.object.summary ||
        typeof response.object.overallScore !== "number"
      ) {
        throw new Error("Incomplete response: missing required fields");
      }

      return response.object;
    } catch (error) {
      lastError = error as Error;
      console.error(`AI generation attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  // If all retries failed, throw the last error
  throw lastError || new Error("AI generation failed after all retries");
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

    console.log("Generating AI code review with config:", {
      provider: config.provider,
      model: config.model,
      hasApiKey: !!config.apiKey,
      diffLength: args.pullRequestData.diffContent.length,
      filesCount: args.pullRequestData.files.length,
    });

    try {
      const result = await callOpenRouterStructured(prompt, config, {
        maxTokens: 4000,
        temperature: 0.3,
      });

      console.log("AI code review generated successfully:", {
        summaryLength: result.summary.length,
        overallScore: result.overallScore,
        findingsCount: result.findings.length,
        suggestionsCount: result.suggestions.length,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("AI code review generation failed:", {
        error: errorMessage,
        provider: config.provider,
        model: config.model,
        diffLength: args.pullRequestData.diffContent.length,
      });

      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error(`No object generated from OpenRouter: ${error.cause}`);
      }

      // Re-throw with more context
      throw new Error(`AI code review failed: ${errorMessage}`);
    }
  },
});
