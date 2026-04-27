import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  APP_NAME: z.string().trim().min(1).default("saas-file-management-backend"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().min(1).default("7d"),
  FRONTEND_URL: z.string().trim().min(1).default("http://localhost:3000"),
  SMTP_HOST: z.string().trim().min(1).default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  ACCESS_TOKEN_COOKIE_NAME: z.string().trim().min(1).default("access_token"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().trim().min(1).default("refresh_token"),
  COOKIE_DOMAIN: z.string().trim().default(""),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

type EnvSource = Record<string, string | undefined>;

const buildEnvError = (errors: z.ZodIssue[]) =>
  errors.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");

const isAllowedCorsOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const createEnv = (source: EnvSource = process.env) => {
  const parsedEnv = envSchema.safeParse(source);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid environment configuration: ${buildEnvError(parsedEnv.error.issues)}`
    );
  }

  const frontendUrls = parsedEnv.data.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const invalidOrigins = frontendUrls.filter(
    (origin) => !isAllowedCorsOrigin(origin)
  );

  if (invalidOrigins.length > 0) {
    throw new Error(
      `Invalid FRONTEND_URL configuration. Expected comma-separated absolute URLs, received: ${invalidOrigins.join(", ")}`
    );
  }

  const cookieSameSite =
    parsedEnv.data.COOKIE_SAME_SITE ??
    (parsedEnv.data.NODE_ENV === "production" ? "none" : "lax");

  return Object.freeze({
    ...parsedEnv.data,
    FRONTEND_URLS: frontendUrls,
    COOKIE_DOMAIN: parsedEnv.data.COOKIE_DOMAIN || undefined,
    COOKIE_SAME_SITE: cookieSameSite,
    COOKIE_SECURE:
      parsedEnv.data.NODE_ENV === "production" || cookieSameSite === "none",
  });
};

export const env = createEnv();
