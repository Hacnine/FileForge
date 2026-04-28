import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mocks.verify,
    JsonWebTokenError: class JsonWebTokenError extends Error {},
    TokenExpiredError: class TokenExpiredError extends Error {},
  },
  verify: mocks.verify,
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {},
}));

vi.mock("../../src/config/database", () => ({
  default: mocks.prisma,
}));

import { authenticate } from "../../src/common/middleware/auth";

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts an access token from cookies when no bearer header is present", async () => {
    mocks.verify.mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });

    const req = {
      headers: {},
      cookies: {
        access_token: "cookie-access-token",
      },
    } as any;
    const next = vi.fn();

    await authenticate(req, {} as any, next);

    expect(mocks.verify).toHaveBeenCalledWith(
      "cookie-access-token",
      expect.any(String)
    );
    expect(req.user).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    expect(next).toHaveBeenCalledWith();
  });
});