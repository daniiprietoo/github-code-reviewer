import "@github-code-reviewer/ui/globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Provider as AnalyticsProvider } from "@github-code-reviewer/analytics/client";
import { cn } from "@github-code-reviewer/ui/utils";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConvexClientProvider } from "./convex-client-provider";

const DepartureMono = localFont({
  src: "../fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://v1-convex.vercel.app"),
  title: "GitHub Code Reviewer",
  description:
    "GitHub Code Reviewer is a tool that helps you review code changes in a GitHub pull request.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${DepartureMono.variable} ${GeistSans.variable} ${GeistMono.variable}`,
          "antialiased dark"
        )}
      >
        <ConvexClientProvider>
          <Header />
          {children}
          <Footer />
        </ConvexClientProvider>

        <AnalyticsProvider />
      </body>
    </html>
  );
}
