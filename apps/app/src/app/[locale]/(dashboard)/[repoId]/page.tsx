import { PullRequestsSection } from "./_components/pullrequests-client";
import { RepositoryHeader } from "./_components/repository-header";

export default async function Page({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = await params;


  return (
    <div className="min-h-screen bg-secondary dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Repository Header */}
        <RepositoryHeader repoId={repoId} />

        {/* Pull Requests Section */}
        <div className="mt-8">
          <PullRequestsSection repoId={repoId} />
        </div>
      </div>
    </div>
  );
}
