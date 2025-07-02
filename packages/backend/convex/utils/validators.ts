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

const pullRequest = z.object({
  title: z.string(),
  author: z.string(),
  headRef: z.string(),
  baseRef: z.string(),
  status: z.string(),
});

export type PullRequest = z.infer<typeof pullRequest>;
