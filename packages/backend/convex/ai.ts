import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  type ActionCtx,
  type MutationCtx,
  type QueryCtx,
  action,
  internalAction,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

// AI Provider types
export type AIProvider = "openai" | "anthropic" | "google";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface CodeReviewRequest {
  pullRequestTitle: string;
  pullRequestBody?: string;
  diffContent: string;
  files: Array<{
    filename: string;
    patch?: string;
    additions: number;
    deletions: number;
  }>;
}

export interface CodeReviewResponse {
  summary: string;
  overallScore: number;
  findings: Array<{
    type: "improvement" | "issue" | "praise";
    severity: "low" | "medium" | "high";
    message: string;
    file?: string;
    line?: number;
  }>;
  suggestions: string[];
}

// User AI Configuration Management
export const getUserAIConfig = query({
  args: {},
  handler: async (ctx): Promise<AIConfig | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const config = await ctx.db
      .query("aiConfigurations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return config
      ? {
          provider: config.provider as AIProvider,
          apiKey: config.apiKey,
          model: config.model,
        }
      : null;
  },
});

export const setUserAIConfig = mutation({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
    ),
    apiKey: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Validate and sanitize inputs
    const apiKey = args.apiKey.trim();
    if (!apiKey || apiKey.length < 10) {
      return {
        success: false,
        error: "API key must be at least 10 characters long",
      };
    }

    if (apiKey.length > 500) {
      return { success: false, error: "API key is too long" };
    }

    // Validate model if provided
    if (args.model) {
      const model = args.model.trim();
      if (model.length > 100) {
        return { success: false, error: "Model name is too long" };
      }
    }

    try {
      // Check if config already exists
      const existingConfig = await ctx.db
        .query("aiConfigurations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (existingConfig) {
        // Update existing config
        await ctx.db.patch(existingConfig._id, {
          provider: args.provider,
          apiKey: apiKey,
          model: args.model?.trim(),
          updatedAt: Date.now(),
        });
      } else {
        // Create new config
        await ctx.db.insert("aiConfigurations", {
          userId,
          provider: args.provider,
          apiKey: apiKey,
          model: args.model?.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to save AI config:", error);
      return { success: false, error: "Failed to save configuration" };
    }
  },
});

export const deleteUserAIConfig = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Find and delete the existing config
      const existingConfig = await ctx.db
        .query("aiConfigurations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!existingConfig) {
        return { success: false, error: "No AI configuration found to delete" };
      }

      await ctx.db.delete(existingConfig._id);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete AI config:", error);
      return { success: false, error: "Failed to delete configuration" };
    }
  },
});

export const testAIConnection = action({
  args: {
    provider: v.union(
      v.literal("openai"),
      v.literal("anthropic"),
      v.literal("google"),
    ),
    apiKey: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      const aiService = createAIService(args);

      // Test with a simple prompt
      await aiService.generateResponse(
        "Test connection. Please respond with 'OK' if you can read this.",
        { maxTokens: 10 },
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// AI Service Implementation
class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateCodeReview(
    request: CodeReviewRequest,
  ): Promise<CodeReviewResponse> {
    const prompt = this.buildCodeReviewPrompt(request);

    try {
      const response = await this.generateResponse(prompt, {
        maxTokens: 2000,
        temperature: 0.3,
      });

      return this.parseCodeReviewResponse(response);
    } catch (error) {
      console.error("AI code review generation failed:", error);
      throw new Error(
        `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async generateResponse(
    prompt: string,
    options: { maxTokens?: number; temperature?: number } = {},
  ): Promise<string> {
    switch (this.config.provider) {
      case "openai":
        return this.callOpenAI(prompt, options);
      case "anthropic":
        return this.callAnthropic(prompt, options);
      case "google":
        return this.callGoogle(prompt, options);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  private buildCodeReviewPrompt(request: CodeReviewRequest): string {
    return `
You are an expert code reviewer. Please analyze this pull request and provide a comprehensive review.

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

Please provide your review in the following JSON format:
{
  "summary": "Brief overall summary of the changes",
  "overallScore": 85,
  "findings": [
    {
      "type": "improvement|issue|praise",
      "severity": "low|medium|high",
      "message": "Detailed explanation",
      "file": "filename (optional)",
      "line": 123
    }
  ],
  "suggestions": ["List of actionable suggestions"]
}

Focus on:
- Code quality and best practices
- Potential bugs or security issues
- Performance considerations
- Maintainability and readability
- Architecture and design patterns

Be constructive and specific in your feedback.
`;
  }

  private parseCodeReviewResponse(response: string): CodeReviewResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      return {
        summary: parsed.summary || "No summary provided",
        overallScore: Math.max(0, Math.min(100, parsed.overallScore || 50)),
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        summary: "AI analysis completed, but response parsing failed",
        overallScore: 50,
        findings: [
          {
            type: "issue",
            severity: "low",
            message: "Unable to parse AI response properly",
          },
        ],
        suggestions: ["Consider reviewing the AI configuration"],
      };
    }
  }

  private async callOpenAI(
    prompt: string,
    options: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  private async callAnthropic(
    prompt: string,
    options: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model || "claude-3-sonnet-20240229",
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  private async callGoogle(
    prompt: string,
    options: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || "gemini-pro"}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.3,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
}

// Factory function to create AI service
function createAIService(config: AIConfig): AIService {
  return new AIService(config);
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
  handler: async (ctx, args): Promise<CodeReviewResponse> => {
    // Get user's AI configuration
    const config = await ctx.runQuery(internal.ai.getUserAIConfigInternal, {
      userId: args.userId,
    });

    if (!config) {
      throw new Error("User has not configured AI settings");
    }

    const aiService = createAIService(config);

    return await aiService.generateCodeReview({
      pullRequestTitle: args.pullRequestData.title,
      pullRequestBody: args.pullRequestData.body,
      diffContent: args.pullRequestData.diffContent,
      files: args.pullRequestData.files,
    });
  },
});

// Internal query to get user AI config
export const getUserAIConfigInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<AIConfig | null> => {
    const config = await ctx.db
      .query("aiConfigurations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return config
      ? {
          provider: config.provider as AIProvider,
          apiKey: config.apiKey,
          model: config.model,
        }
      : null;
  },
});
