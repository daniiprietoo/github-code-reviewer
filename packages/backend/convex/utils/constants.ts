export const GITHUB_EVENTS = {
  INSTALLATION: "installation",
  INSTALLATION_REPOSITORIES: "installation_repositories",
  PULL_REQUEST: "pull_request",
} as const;

export const INSTALLATION_ACTIONS = {
  CREATED: "created",
  DELETED: "deleted",
  SUSPEND: "suspend",
  UNSUSPEND: "unsuspend",
} as const;

export const PULL_REQUEST_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  SYNCHRONIZE: "synchronize",
  REOPENED: "reopened",
  EDITED: "edited",
} as const;

export const PULL_REQUEST_STATUS = {
  PENDING: "pending",
  ANALYZING: "analyzing",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const REPOSITORY_PERMISSIONS = {
  READ: "read",
  WRITE: "write",
} as const;

export const DEFAULT_REPOSITORY_SETTINGS = {
  enableStyleChecks: true,
  enableSecurityChecks: true,
  enablePerformanceChecks: true,
  minSeverity: "medium",
  excludePatterns: [],
  customRules: [],
};

export const SEVERITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const REVIEW_CATEGORIES = {
  BUG: "bug",
  SECURITY: "security",
  STYLE: "style",
  PERFORMANCE: "performance",
} as const;
