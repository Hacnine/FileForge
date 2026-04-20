import prisma from "../config/database";
import { AuditAction, Prisma } from "@prisma/client";
import { Request } from "express";

interface AuditOptions {
  userId?: string;
  action: AuditAction;
  resource?: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export const createAuditLog = async (options: AuditOptions): Promise<void> => {
  try {
    const { userId, action, resource, metadata, req } = options;
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        resource: resource ?? null,
        ipAddress: req ? getClientIp(req) : null,
        userAgent: req?.headers["user-agent"] ?? null,
        metadata: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  } catch {
    // Audit log failures must never crash the main flow
  }
};

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return first.trim();
  }
  return req.socket?.remoteAddress ?? "";
}
