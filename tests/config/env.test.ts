import { describe, expect, it } from "vitest";
import { createEnv } from "../../src/config/env";

const baseEnv = {
  APP_NAME: "saas-file-management-backend",
  NODE_ENV: "test",
  PORT: "5000",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/saas_file_management",
  JWT_SECRET: "12345678901234567890123456789012",
  JWT_REFRESH_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
  JWT_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "7d",
  FRONTEND_URL: "http://localhost:3000, https://app.example.com",
  ACCESS_TOKEN_COOKIE_NAME: "access_token",
  REFRESH_TOKEN_COOKIE_NAME: "refresh_token",
  COOKIE_DOMAIN: "",
  COOKIE_SAME_SITE: "lax",
  LOG_LEVEL: "silent",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "mailer@example.com",
  SMTP_PASS: "password",
} satisfies Record<string, string>;

describe("createEnv", () => {
  it("parses required values and normalizes multiple CORS origins", () => {
    const env = createEnv(baseEnv);

    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe("test");
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.FRONTEND_URLS).toEqual([
      "http://localhost:3000",
      "https://app.example.com",
    ]);
  });

  it("rejects weak JWT secrets", () => {
    expect(() =>
      createEnv({
        ...baseEnv,
        JWT_SECRET: "too-short",
      })
    ).toThrow(/JWT_SECRET must be at least 32 characters/);
  });

  it("rejects malformed frontend origins", () => {
    expect(() =>
      createEnv({
        ...baseEnv,
        FRONTEND_URL: "localhost:3000",
      })
    ).toThrow(/Invalid FRONTEND_URL configuration/);
  });
});