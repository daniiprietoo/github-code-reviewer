import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "../_generated/server";
import { env } from "../env";

// AI Provider types
export type AIProvider = "openrouter" | "openrouter-free";

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
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
      v.literal("openrouter"),
      v.literal("openrouter-free"),
    ),
    apiKey: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    if (args.provider === "openrouter") {
      const { success, error } = validateApiKey(args.apiKey);
      if (!success) {
        return {
          success: false,
          error: error,
        };
      }
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
          apiKey: args.apiKey?.trim() || env.OPENROUTER_API_KEY,
          model: args.model?.trim(),
          updatedAt: Date.now(),
        });
      } else {
        // Create new config
        await ctx.db.insert("aiConfigurations", {
          userId,
          provider: args.provider,
          apiKey: args.apiKey?.trim() || env.OPENROUTER_API_KEY,
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

const validateApiKey = (apiKey: string | undefined) => {
  if (!apiKey) {
    return { success: false, error: "API key is required" };
  }

  if (apiKey.length < 10) {
    return { success: false, error: "API key must be at least 10 characters long" };
  }

  if (apiKey.length > 500) {
    return { success: false, error: "API key is too long" };
  }

  return { success: true };
};

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
