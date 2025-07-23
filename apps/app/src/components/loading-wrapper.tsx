import type { ReactNode } from "react";

interface LoadingWrapperProps {
  isLoading: boolean;
  loadingComponent: ReactNode;
  children: ReactNode;
  fallback?: ReactNode;
}

export function LoadingWrapper({
  isLoading,
  loadingComponent,
  children,
  fallback,
}: LoadingWrapperProps) {
  if (isLoading) {
    return loadingComponent;
  }

  if (fallback) {
    return fallback;
  }

  return children;
}
