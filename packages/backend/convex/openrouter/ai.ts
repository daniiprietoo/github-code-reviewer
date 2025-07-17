import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import type { AIConfig } from "./aiconfig";

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

export const testAIConnection = action({
  args: {
    provider: v.union(v.literal("openrouter"), v.literal("openrouter-free")),
    apiKey: v.optional(v.string()),
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
      case "openrouter":
        return this.callOpenRouter(prompt, options);
      case "openrouter-free":
        return this.callOpenRouter(prompt, options);
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

  private async callOpenRouter(
    prompt: string,
    options: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const model = this.config.model || "deepseek/deepseek-chat-v3-0324:free";
    const body = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Please analyze the following pull request.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.3,
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
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
    const config = await ctx.runQuery(
      internal.openrouter.aiconfig.getUserAIConfigInternal,
      {
        userId: args.userId,
      },
    );

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
