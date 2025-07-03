"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@github-code-reviewer/ui/button";

export function GitHubSignin() {
  const { signIn } = useAuthActions();

  return (
    <Button
      onClick={() => signIn("github")}
      variant="outline"
      className="font-mono"
    >
      Sign in with GitHub
    </Button>
  );
}
