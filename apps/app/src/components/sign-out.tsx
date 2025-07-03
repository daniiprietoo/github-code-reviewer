"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@github-code-reviewer/ui/button";
import { Icons } from "@github-code-reviewer/ui/icons";

export function SignOut() {
  const { signOut } = useAuthActions();

  return (
    <Button
      onClick={signOut}
      variant="outline"
      className="font-mono gap-2 flex items-center"
    >
      <Icons.SignOut className="size-4" />
      <span>Sign out</span>
    </Button>
  );
}
