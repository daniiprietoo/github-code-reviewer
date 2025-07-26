"use client";

import { api } from "@github-code-reviewer/backend/convex/_generated/api";
import { Button } from "@github-code-reviewer/ui/button";
import { Input } from "@github-code-reviewer/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@github-code-reviewer/ui/select";
import { AIConfigSkeleton } from "@github-code-reviewer/ui/skeleton";
import { useAction, useMutation, useQuery } from "convex/react";
import { Bot, Edit, Eye, EyeOff, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

interface AIConfig {
  provider: "openrouter" | "openrouter-free";
  apiKey?: string;
  model?: string;
}

const AI_PROVIDERS = {
  openrouter: {
    name: "OpenRouter",
    models: [
      "anthropic/claude-sonnet-4",
      "google/gemini-2.5-flash",
      "anthropic/claude-opus-4",
      "x-ai/grok-4",
      "google/gemini-2.5-pro",
    ],
    defaultModel: "anthropic/claude-sonnet-4",
  },
  "openrouter-free": {
    name: "OpenRouter Free",
    models: [
      "deepseek/deepseek-chat-v3-0324:free",
      "deepseek/deepseek-r1-0528:free",
      "moonshotai/kimi-k2:free",
    ],
    defaultModel: "deepseek/deepseek-chat-v3-0324:free",
  },
} as const;

export function AIConfig() {
  const config = useQuery(api.openrouter.aiconfig.getUserAIConfig);
  const setConfig = useMutation(api.openrouter.aiconfig.setUserAIConfig);
  const deleteConfig = useMutation(api.openrouter.aiconfig.deleteUserAIConfig);
  const testConnection = useAction(api.openrouter.ai.testAIConnection);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<AIConfig>({
    provider: "openrouter",
    apiKey: "",
    model: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handleAdd = () => {
    setFormData({
      provider: "openrouter",
      apiKey: "",
      model: AI_PROVIDERS.openrouter.defaultModel,
    });
    setIsEditing(false);
    setShowForm(true);
    setTestResult(null);
  };

  const handleEdit = () => {
    if (config) {
      setFormData({
        apiKey: config.apiKey || "",
        provider: config.provider,
        model:
          config.model ||
          AI_PROVIDERS[config.provider as keyof typeof AI_PROVIDERS]
            .defaultModel,
      });
      setIsEditing(true);
      setShowForm(true);
      setTestResult(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditing(false);
    setTestResult(null);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteConfig();
      if (result.success) {
        setShowForm(false);
        setIsEditing(false);
        setTestResult(null);
      } else {
        setTestResult({
          success: false,
          error: result.error || "Failed to delete configuration",
        });
      }
    } catch (error) {
      console.error("Failed to delete AI config:", error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateFormData = <K extends keyof AIConfig>(
    field: K,
    value: AIConfig[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleProviderChange = (provider: "openrouter" | "openrouter-free") => {
    setFormData((prev) => ({
      ...prev,
      provider,
      apiKey: "",
      model: AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS].defaultModel,
    }));
    setTestResult(null);
  };

  const handleSave = async () => {
    if (formData.provider === "openrouter" && !formData.apiKey?.trim()) {
      setTestResult({
        success: false,
        error:
          "API key is required for OpenRouter. Get your API key from OpenRouter Platform",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await setConfig({
        provider: formData.provider,
        apiKey: formData.apiKey?.trim(),
        model:
          formData.model ||
          AI_PROVIDERS[formData.provider as keyof typeof AI_PROVIDERS]
            .defaultModel,
      });

      if (result.success) {
        setShowForm(false);
        setIsEditing(false);
        setTestResult(null);
      } else {
        setTestResult({
          success: false,
          error: result.error || "Failed to save configuration",
        });
      }
    } catch (error) {
      console.error("Failed to save AI config:", error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!formData.apiKey?.trim()) {
      return;
    }

    setIsTesting(true);
    try {
      const result = await testConnection({
        provider: formData.provider,
        apiKey: formData.apiKey?.trim(),
        model:
          formData.model ||
          AI_PROVIDERS[formData.provider as keyof typeof AI_PROVIDERS]
            .defaultModel,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const maskApiKey = (key: string) => {
    // Use fixed-length masking to avoid revealing key length
    if (key.length <= 8) return "****-****";
    return `${key.slice(0, 3)}${"*".repeat(12)}${key.slice(-3)}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 dark:from-white dark:via-purple-200 dark:to-indigo-200 bg-clip-text text-transparent">
              AI Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your AI provider to enable automated code reviews
            </p>
          </div>
        </div>
        {config === null && !showForm && (
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        )}
      </div>

      {config === undefined && <AIConfigSkeleton />}

      {/* Existing Configuration */}
      {config && !showForm && (
        <div className="border border-gray-200/60 dark:border-gray-700/60 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg shadow-gray-500/10">
          <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-purple-50/50 dark:from-gray-800/80 dark:to-purple-950/30 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Current Configuration
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Provider
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {
                    AI_PROVIDERS[config.provider as keyof typeof AI_PROVIDERS]
                      .name
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Model
                </label>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {config.model ||
                    AI_PROVIDERS[config.provider as keyof typeof AI_PROVIDERS]
                      .defaultModel}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  API Key
                </label>
                {config.provider === "openrouter" ? (
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-mono truncate text-gray-700 dark:text-gray-300">
                      {showApiKey
                        ? config.apiKey || ""
                        : maskApiKey(config.apiKey || "")}
                    </p>
                    <Button
                      onClick={() => setShowApiKey(!showApiKey)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      {showApiKey ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs font-mono truncate text-green-600 dark:text-green-400">
                    Free
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {showForm && (
        <div className="border border-gray-200/60 dark:border-gray-700/60 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg shadow-gray-500/10">
          <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/50 dark:from-gray-800/80 dark:to-blue-950/30 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {isEditing ? "Edit Configuration" : "Add Configuration"}
              </h4>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                AI Provider
              </label>
              <Select
                value={formData.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            {formData.provider === "openrouter" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  API Key
                </label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.apiKey}
                  onChange={(e) => updateFormData("apiKey", e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get your API key from OpenRouter Platform
                </p>
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Model
              </label>
              <Select
                value={
                  formData.model ||
                  AI_PROVIDERS[formData.provider as keyof typeof AI_PROVIDERS]
                    .defaultModel
                }
                onValueChange={(model) => updateFormData("model", model)}
              >
                <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS[
                    formData.provider as keyof typeof AI_PROVIDERS
                  ].models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-4 rounded-xl text-sm font-medium ${
                  testResult.success
                    ? "bg-green-50/80 text-green-700 border border-green-200/60 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/60"
                    : "bg-red-50/80 text-red-700 border border-red-200/60 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/60"
                } backdrop-blur-sm`}
              >
                {testResult.success
                  ? "✅ Connection test successful!"
                  : `❌ Connection failed: ${testResult.error}`}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleTest}
                disabled={
                  (formData.provider === "openrouter" &&
                    !formData.apiKey?.trim()) ||
                  formData.provider === "openrouter-free" ||
                  isTesting
                }
                variant="outline"
                className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  (formData.provider === "openrouter" &&
                    !formData.apiKey?.trim()) ||
                  isSaving
                }
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Update Configuration"
                    : "Save Configuration"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {config === null && !showForm && (
        <div className="text-center py-16 border border-dashed border-purple-200 dark:border-purple-800/50 rounded-2xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25 mx-auto mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              No AI configuration
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              Add your AI provider configuration to enable automated code
              reviews on your repositories.
            </p>
            <Button
              onClick={handleAdd}
              className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </div>
      )}

      {/* How it works */}
      {config && (
        <div className="border-t border-gray-200/60 dark:border-gray-700/60 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              How it works
            </h4>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
            <li>
              • AI reviews are automatically triggered on new pull requests
            </li>
            <li>
              • Code changes are analyzed for quality, security, and best
              practices
            </li>
            <li>• Detailed feedback is posted as comments on GitHub</li>
            {config.provider === "openrouter" ? (
              <>
                <li>• Your personal API key is used for all AI requests</li>
                <li>• You have full control over costs and usage limits</li>
                <li>• Access to premium models with higher quality reviews</li>
              </>
            ) : (
              <>
                <li>• Free tier with shared resources (no API key required)</li>
                <li>• Rate limits apply to ensure fair usage for all users</li>
                <li>• Basic models optimized for code review tasks</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
