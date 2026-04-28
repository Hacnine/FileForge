import { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env";
import { hashToken } from "./crypto";

const durationToMs = (value: string): number | undefined => {
  const normalized = value.trim();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized) * 1000;
  }

  const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const buildCookieBaseOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

const buildCookieOptions = (
  path: string,
  expiresIn: string
): CookieOptions => {
  const maxAge = durationToMs(expiresIn);

  return {
    ...buildCookieBaseOptions(),
    path,
    ...(maxAge ? { maxAge } : {}),
  };
};

const buildClearCookieOptions = (path: string): CookieOptions => ({
  ...buildCookieBaseOptions(),
  path,
});

export const getAccessTokenFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.split(" ")[1];
    if (bearerToken) {
      return bearerToken;
    }
  }

  const cookieToken = req.cookies?.[env.ACCESS_TOKEN_COOKIE_NAME];
  return typeof cookieToken === "string" && cookieToken.trim().length > 0
    ? cookieToken
    : undefined;
};

export const getRefreshTokenFromRequest = (
  req: Request
): string | undefined => {
  const bodyToken = req.body?.refreshToken;
  if (typeof bodyToken === "string" && bodyToken.trim().length > 0) {
    return bodyToken;
  }

  const cookieToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  return typeof cookieToken === "string" && cookieToken.trim().length > 0
    ? cookieToken
    : undefined;
};

export const getStoredRefreshTokenCandidates = (refreshToken: string) =>
  Array.from(new Set([hashToken(refreshToken), refreshToken]));

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) => {
  res.cookie(
    env.ACCESS_TOKEN_COOKIE_NAME,
    tokens.accessToken,
    buildCookieOptions("/", env.JWT_EXPIRES_IN)
  );
  res.cookie(
    env.REFRESH_TOKEN_COOKIE_NAME,
    tokens.refreshToken,
    buildCookieOptions("/api/auth", env.JWT_REFRESH_EXPIRES_IN)
  );
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(
    env.ACCESS_TOKEN_COOKIE_NAME,
    buildClearCookieOptions("/")
  );
  res.clearCookie(
    env.REFRESH_TOKEN_COOKIE_NAME,
    buildClearCookieOptions("/api/auth")
  );
};