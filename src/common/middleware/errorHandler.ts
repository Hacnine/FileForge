import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestIdHeader = res.getHeader("X-Request-Id") ?? res.getHeader("x-request-id");
  const requestId = typeof requestIdHeader === "string" ? requestIdHeader : undefined;

  if (err instanceof AppError) {
    logger.warn(
      {
        requestId,
        statusCode: err.statusCode,
        method: req.method,
        path: req.originalUrl,
        message: err.message,
      },
      "Operational error handled"
    );

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      requestId,
    });
  }

  logger.error(
    {
      requestId,
      method: req.method,
      path: req.originalUrl,
      err,
    },
    "Unexpected error handled"
  );

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    requestId,
  });
};
