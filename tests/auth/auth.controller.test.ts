import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "../../src/common/utils/crypto";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  compare: vi.fn(),
  genSalt: vi.fn(),
  hash: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
  createAuditLog: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("../../src/config/database", () => ({
  default: mocks.prisma,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mocks.compare,
    genSalt: mocks.genSalt,
    hash: mocks.hash,
  },
  compare: mocks.compare,
  genSalt: mocks.genSalt,
  hash: mocks.hash,
}));

vi.mock("../../src/common/utils/jwt", () => ({
  generateAccessToken: mocks.generateAccessToken,
  generateRefreshToken: mocks.generateRefreshToken,
  verifyRefreshToken: mocks.verifyRefreshToken,
}));

vi.mock("../../src/common/utils/auditLog", () => ({
  createAuditLog: mocks.createAuditLog,
}));

vi.mock("../../src/common/utils/email", () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));

import {
  login,
  refreshAccessToken,
} from "../../src/modules/auth/auth.controller";

const createResponse = () => {
  const response = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  } as any;

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
};

describe("auth controller security behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores a hashed refresh token and sets auth cookies on login", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      password: "hashed-password",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "USER",
      isActive: true,
      isEmailVerified: true,
    });
    mocks.compare.mockResolvedValue(true);
    mocks.generateAccessToken.mockReturnValue("access-token");
    mocks.generateRefreshToken.mockReturnValue("refresh-token");
    mocks.prisma.user.update.mockResolvedValue({});

    const req = {
      body: {
        email: "user@example.com",
        password: "StrongPassword1",
      },
    } as any;
    const res = createResponse();
    const next = vi.fn();

    await login(req, res, next);

    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        refreshToken: hashToken("refresh-token"),
        lastLoginAt: expect.any(Date),
      },
    });
    expect(res.cookie).toHaveBeenCalledWith(
      "access_token",
      "access-token",
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refresh_token",
      "refresh-token",
      expect.objectContaining({ httpOnly: true, path: "/api/auth" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts refresh tokens from cookies and rotates the stored token hash", async () => {
    mocks.verifyRefreshToken.mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    mocks.prisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
      isActive: true,
    });
    mocks.generateAccessToken.mockReturnValue("new-access-token");
    mocks.generateRefreshToken.mockReturnValue("new-refresh-token");
    mocks.prisma.user.update.mockResolvedValue({});

    const req = {
      body: {},
      cookies: {
        refresh_token: "legacy-refresh-token",
      },
    } as any;
    const res = createResponse();
    const next = vi.fn();

    await refreshAccessToken(req, res, next);

    expect(mocks.prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        refreshToken: {
          in: [
            hashToken("legacy-refresh-token"),
            "legacy-refresh-token",
          ],
        },
      },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        refreshToken: hashToken("new-refresh-token"),
      },
    });
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(next).not.toHaveBeenCalled();
  });
});