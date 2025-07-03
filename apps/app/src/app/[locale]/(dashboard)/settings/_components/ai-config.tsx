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
import { useAction, useMutation, useQuery } from "convex/react";
import { Edit, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface AIConfig {
  provider: "openai" | "anthropic" | "google";
  apiKey: string;
  model?: string;
}

const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: ["gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"],
    defaultModel: "gpt-4",
  },
  anthropic: {
    name: "Anthropic Claude",
    models: [
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    defaultModel: "claude-3-sonnet-20240229",
  },
  google: {
    name: "Google AI",
    models: ["gemini-pro", "gemini-pro-vision"],
    defaultModel: "gemini-pro",
  },
} as const;

export function AIConfig() {
  const config = useQuery(api.ai.getUserAIConfig);
  const setConfig = useMutation(api.ai.setUserAIConfig);
  const deleteConfig = useMutation(api.ai.deleteUserAIConfig);
  const testConnection = useAction(api.ai.testAIConnection);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState<AIConfig>({
    provider: "openai",
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
      provider: "openai",
      apiKey: "",
      model: AI_PROVIDERS.openai.defaultModel,
    });
    setIsEditing(false);
    setShowForm(true);
    setTestResult(null);
  };

  const handleEdit = () => {
    if (config) {
      setFormData({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model || AI_PROVIDERS[config.provider].defaultModel,
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

  const handleProviderChange = (
    provider: "openai" | "anthropic" | "google"
  ) => {
    setFormData((prev) => ({
      ...prev,
      provider,
      model: AI_PROVIDERS[provider].defaultModel,
    }));
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({
        success: false,
        error: "API key is required",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await setConfig({
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        model: formData.model || AI_PROVIDERS[formData.provider].defaultModel,
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
    if (!formData.apiKey.trim()) {
      return;
    }

    setIsTesting(true);
    try {
      const result = await testConnection({
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        model: formData.model || AI_PROVIDERS[formData.provider].defaultModel,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">AI Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure your AI provider to enable automated code reviews
          </p>
        </div>
        {!config && !showForm && (
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Configuration
          </Button>
        )}
      </div>

      {/* Existing Configuration */}
      {config && !showForm && (
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Current Configuration</h4>
              <div className="flex gap-2">
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Provider
                </label>
                <p className="text-sm font-medium">
                  {AI_PROVIDERS[config.provider].name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Model
                </label>
                <p className="text-sm font-medium">
                  {config.model || AI_PROVIDERS[config.provider].defaultModel}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  API Key
                </label>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-mono truncate">
                    {showApiKey ? config.apiKey : maskApiKey(config.apiKey)}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {showForm && (
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {isEditing ? "Edit Configuration" : "Add Configuration"}
              </h4>
              <Button onClick={handleCancel} variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select
                value={formData.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={formData.apiKey}
                onChange={(e) => updateFormData("apiKey", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {formData.provider === "openai" &&
                  "Get your API key from OpenAI Platform"}
                {formData.provider === "anthropic" &&
                  "Get your API key from Anthropic Console"}
                {formData.provider === "google" &&
                  "Get your API key from Google AI Studio"}
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select
                value={
                  formData.model || AI_PROVIDERS[formData.provider].defaultModel
                }
                onValueChange={(model) => updateFormData("model", model)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS[formData.provider].models.map((model) => (
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
                className={`p-3 rounded-md text-sm ${
                  testResult.success
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {testResult.success
                  ? "✅ Connection test successful!"
                  : `❌ Connection failed: ${testResult.error}`}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleTest}
                disabled={!formData.apiKey.trim() || isTesting}
                variant="outline"
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.apiKey.trim() || isSaving}
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
      {!config && !showForm && (
        <div className="text-center py-8 border rounded-lg border-dashed">
          <div className="space-y-2">
            <h4 className="font-medium">No AI configuration</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add your AI provider configuration to enable automated code
              reviews on your repositories.
            </p>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </div>
        </div>
      )}

      {/* How it works */}
      {config && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">How it works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • AI reviews are automatically triggered on new pull requests
            </li>
            <li>
              • Code changes are analyzed for quality, security, and best
              practices
            </li>
            <li>• Detailed feedback is posted as comments on GitHub</li>
            <li>• Your API key is used for all AI requests</li>
          </ul>
        </div>
      )}
    </div>
  );
}
