import pino from "pino";
import { env } from "../../config/env";

export const logger = pino({
  name: env.APP_NAME,
  level: env.LOG_LEVEL,
  base: {
    service: env.APP_NAME,
    environment: env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
      "res.headers['set-cookie']",
      "response.headers['set-cookie']",
      "password",
      "token",
      "refreshToken",
      "body.password",
      "body.currentPassword",
      "body.newPassword",
      "body.token",
      "body.refreshToken",
      "*.password",
      "*.token",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});