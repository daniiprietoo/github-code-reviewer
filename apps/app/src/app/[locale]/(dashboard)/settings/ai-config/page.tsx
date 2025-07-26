import { AIConfig } from "./ai-config";

export default function AIConfigPage() {
  return (
    <div className="flex h-full w-full flex-col gap-8">
      <div className="relative overflow-hidden flex w-full flex-col items-start rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg shadow-gray-500/10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-indigo-50/30 dark:from-purple-950/20 dark:via-transparent dark:to-indigo-950/10 opacity-60" />

        <div className="relative w-full p-6">
          <AIConfig />
        </div>
      </div>
    </div>
  );
}
