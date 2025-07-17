import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    LOOPS_FORM_ID: z.optional(z.string().min(1)),
    POLAR_ORGANIZATION_TOKEN: z.string().min(1),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.optional(z.string().min(1)),
    RESEND_SENDER_EMAIL_AUTH: z.optional(z.string().email()),
    SITE_URL: z.string().url(),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    GITHUB_APP_ID: z.string().min(1),
    GITHUB_APP_CLIENT_ID: z.string().min(1),
    GITHUB_APP_CLIENT_SECRET: z.string().min(1),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1),
    GITHUB_APP_WEBHOOK_SECRET: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    LOOPS_FORM_ID: process.env.LOOPS_FORM_ID,
    POLAR_ORGANIZATION_TOKEN: process.env.POLAR_ORGANIZATION_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_SENDER_EMAIL_AUTH: process.env.RESEND_SENDER_EMAIL_AUTH,
    SITE_URL: process.env.SITE_URL,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_CLIENT_ID: process.env.GITHUB_APP_CLIENT_ID,
    GITHUB_APP_CLIENT_SECRET: process.env.GITHUB_APP_CLIENT_SECRET,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_WEBHOOK_SECRET: process.env.GITHUB_APP_WEBHOOK_SECRET,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
  skipValidation: !process.env.VALIDATE_ENV,
});
