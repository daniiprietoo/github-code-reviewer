import { z } from "zod";

export const username = z
  .string()
  .min(3)
  .max(32)
  .toLowerCase()
  .trim()
  .regex(
    /^[a-zA-Z0-9]+$/,
    "Username may only contain alphanumeric characters.",
  );

// Pull Request Schema
const pullRequest = z.object({
  title: z.string(),
  author: z.string(),
  headRef: z.string(),
  baseRef: z.string(),
  status: z.string(),
});

export type PullRequest = z.infer<typeof pullRequest>;

// Code Review Schema for AISDK
export const CODE_REVIEW_SCHEMA = z.object({
  summary: z
    .string()
    .describe("Brief overall summary of the changes and code quality"),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall code quality score from 0 to 100")
    .default(50),
  findings: z
    .array(
      z.object({
        type: z
          .enum(["improvement", "issue", "praise"])
          .describe("Type of finding"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("Severity level of the finding"),
        message: z.string().describe("Detailed explanation of the finding"),
        file: z
          .string()
          .optional()
          .describe("File path where the finding was detected (optional)"),
        line: z
          .number()
          .optional()
          .describe("Line number where the finding was detected (optional)"),
      }),
    )
    .describe("Detailed findings from the code review"),
  suggestions: z
    .array(z.string())
    .describe("List of actionable suggestions for improvement")
    .default([]),
});

// Code Review Output Schema
export type CodeReviewOutputSchema = z.infer<typeof CODE_REVIEW_SCHEMA>;

// AI Provider types
export type AIProvider = "openrouter" | "openrouter-free";

// AI Config types
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

// Code Review Request and Response types
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
