"use client";

import { Button } from "@v1/ui/button";
import { Input } from "@v1/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@v1/ui/select";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@v1/backend/convex/_generated/api";

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
  const testConnection = useAction(api.ai.testAIConnection);

  const [formData, setFormData] = useState<AIConfig>({
    provider: config?.provider || "openai",
    apiKey: config?.apiKey || "",
    model: config?.model || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Update form when config loads
  if (config && formData.apiKey === "" && config.apiKey) {
    setFormData({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model || AI_PROVIDERS[config.provider].defaultModel,
    });
  }

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
      return;
    }

    setIsSaving(true);
    try {
      await setConfig({
        provider: formData.provider,
        apiKey: formData.apiKey.trim(),
        model: formData.model || AI_PROVIDERS[formData.provider].defaultModel,
      });
      setTestResult(null);
    } catch (error) {
      console.error("Failed to save AI config:", error);
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure your AI provider to enable automated code reviews. Your API
          key is stored securely.
        </p>
      </div>

      <div className="space-y-4">
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
            }
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
            onValueChange={(model) =>
              setFormData((prev) => ({ ...prev, model }))
            }
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
        <div className="flex gap-2">
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
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">How it works</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Configure your preferred AI provider above</li>
          <li>
            • When pull requests are opened, the AI will analyze the code
            changes
          </li>
          <li>
            • You'll receive detailed feedback on code quality, potential
            issues, and suggestions
          </li>
          <li>• Reviews are posted as comments on your GitHub pull requests</li>
        </ul>
      </div>
    </div>
  );
}
