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

// JSON Schema for structured output
const CODE_REVIEW_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Brief overall summary of the changes and code quality",
    },
    overallScore: {
      type: "number",
      description: "Overall code quality score from 0 to 100",
      minimum: 0,
      maximum: 100,
    },
    findings: {
      type: "array",
      description: "Detailed findings from the code review",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["improvement", "issue", "praise"],
            description: "Type of finding",
          },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Severity level of the finding",
          },
          message: {
            type: "string",
            description: "Detailed explanation of the finding",
          },
          file: {
            type: "string",
            description: "File path where the finding was detected (optional)",
          },
          line: {
            type: "number",
            description:
              "Line number where the finding was detected (optional)",
          },
        },
        required: ["type", "severity", "message"],
        additionalProperties: false,
      },
    },
    suggestions: {
      type: "array",
      description: "List of actionable suggestions for improvement",
      items: {
        type: "string",
      },
    },
  },
  required: ["summary", "overallScore", "findings", "suggestions"],
  additionalProperties: false,
} as const;

export const testAIConnection = action({
  args: {
    provider: v.union(v.literal("openrouter"), v.literal("openrouter-free")),
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
      // Use structured output for code review
      const response = await this.generateStructuredResponse(
        prompt,
        CODE_REVIEW_SCHEMA,
        {
          maxTokens: 2000,
          temperature: 0.3,
        },
      );

      return this.validateCodeReviewResponse(response);
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

  async generateStructuredResponse<T>(
    prompt: string,
    schema: object,
    options: { maxTokens?: number; temperature?: number } = {},
  ): Promise<T> {
    switch (this.config.provider) {
      case "openrouter":
        return this.callOpenRouterStructured<T>(prompt, schema, options);
      case "openrouter-free":
        return this.callOpenRouterStructured<T>(prompt, schema, options);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  private buildCodeReviewPrompt(request: CodeReviewRequest): string {
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

  private validateCodeReviewResponse(response: unknown): CodeReviewResponse {
    // Validate the response structure and apply defaults/sanitization
    const res = response as Record<string, unknown>;
    return {
      summary:
        (typeof res.summary === "string" ? res.summary : null) ||
        "Code review completed",
      overallScore: Math.max(
        0,
        Math.min(
          100,
          (typeof res.overallScore === "number" ? res.overallScore : null) ||
            50,
        ),
      ),
      findings: Array.isArray(res.findings)
        ? res.findings.map((finding: unknown) => {
            const f = finding as Record<string, unknown>;
            return {
              type: (["improvement", "issue", "praise"].includes(
                f.type as string,
              )
                ? f.type
                : "improvement") as "improvement" | "issue" | "praise",
              severity: (["low", "medium", "high"].includes(
                f.severity as string,
              )
                ? f.severity
                : "low") as "low" | "medium" | "high",
              message:
                (typeof f.message === "string" ? f.message : null) ||
                "No message provided",
              file: typeof f.file === "string" ? f.file : undefined,
              line: typeof f.line === "number" ? f.line : undefined,
            };
          })
        : [],
      suggestions: Array.isArray(res.suggestions)
        ? res.suggestions.filter((s): s is string => typeof s === "string")
        : [],
    };
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
            "You are an expert code reviewer. Provide detailed, constructive feedback on code changes.",
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

  private async callOpenRouterStructured<T>(
    prompt: string,
    schema: object,
    options: { maxTokens?: number; temperature?: number },
  ): Promise<T> {
    const model = this.config.model || "anthropic/claude-sonnet-4";
    const body = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Analyze code changes and provide structured feedback.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_review",
          strict: true,
          schema: schema,
        },
      },
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
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenRouter");
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse structured response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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

    // For openrouter-free, we need to provide a system API key since user doesn't have one
    if (config.provider === "openrouter-free") {
      const { env } = await import("../env");
      config.apiKey = env.OPENROUTER_API_KEY;
    }

    if (!config.apiKey) {
      throw new Error("No API key available for AI analysis");
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
