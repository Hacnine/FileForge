import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { logger } from "../utils/logger";

const getDurationMs = (startedAt: bigint) => {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  return Number(durationMs.toFixed(2));
};

export const requestContext = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startedAt = process.hrtime.bigint();
  const existingRequestId = req.header("x-request-id");
  const requestId =
    existingRequestId && existingRequestId.trim().length > 0
      ? existingRequestId
      : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  if (env.NODE_ENV !== "test") {
    res.on("finish", () => {
      const payload = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: getDurationMs(startedAt),
        ip: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      };

      if (res.statusCode >= 500) {
        logger.error(payload, "request completed");
        return;
      }

      if (res.statusCode >= 400) {
        logger.warn(payload, "request completed");
        return;
      }

      logger.info(payload, "request completed");
    });
  }

  next();
};