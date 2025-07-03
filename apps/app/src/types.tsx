import type { Doc } from "@github-code-reviewer/backend/convex/_generated/dataModel";

export type User = Doc<"users"> & {
  avatarUrl?: string;
};
