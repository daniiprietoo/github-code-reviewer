import { AIConfig } from "./ai-config";

export default function AIConfigPage() {
  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="w-full p-6">
          <AIConfig />
        </div>
      </div>
    </div>
  );
}
