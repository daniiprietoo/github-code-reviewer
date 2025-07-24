export default {
  dashboard: {
    title: "Connect Repos",
    description: "Connect your GitHub Repos to get started.",
    bodyTitle: "Repos Connected",
    bodyDescription:
      "You can connect more repos by clicking the button beside.",
    bodyTip: "TIP: Try changing the language!",
    headerTitle: "Dashboard",
    headerDescription: "Manage your apps and view your usage.",
    documentationLink: "Explore Documentation",
    connectMoreRepos: "Connect more repos",
  },
  settings: {
    title: "Settings",
    headerTitle: "Settings",
    headerDescription: "Manage your account settings.",
    avatar: {
      title: "Your Avatar",
      description: "This is your avatar. It will be displayed on your profile.",
      uploadHint: "Click on the avatar to upload a custom one from your files.",
      resetButton: "Reset",
    },
    deleteAccount: {
      title: "Delete Account",
      description:
        "Permanently delete your Convex SaaS account, all of your projects, links and their respective stats.",
      warning: "This action cannot be undone, proceed with caution.",
      deleteButton: "Delete Account",
      confirmButton: "Are you sure?",
    },
    sidebar: {
      general: "General",
      aiConfig: "AI Config",
    },
  },
} as const;
