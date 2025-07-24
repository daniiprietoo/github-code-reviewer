import { AIConfigSkeleton } from "@github-code-reviewer/ui/skeleton";

export default function AIConfigLoading() {
  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="w-full p-6">
          <AIConfigSkeleton />
        </div>
      </div>
    </div>
  );
}
