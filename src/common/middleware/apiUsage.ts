import { Response, NextFunction } from "express";
import prisma from "../../config/database";
import { AuthRequest } from "./auth";

/**
 * Fire-and-forget middleware that records every authenticated API call
 * to the api_usage table for analytics and rate-limit auditing.
 */
export const trackApiUsage = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const userId = req.user?.id;
    if (!userId) return; // skip unauthenticated requests

    prisma.apiUsage
      .create({
        data: {
          userId,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration: Date.now() - startTime,
        },
      })
      .catch(() => {}); // never throw — recording is best-effort
  });

  next();
};
