// BigInt JSON serialization (must be before any BigInt values hit res.json)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { env } from "./config/env";
import { errorHandler } from "./common/middleware/errorHandler";
import { globalLimiter } from "./common/middleware/rateLimiter";
import { requestContext } from "./common/middleware/requestContext";
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
} from "./modules/system/system.controller";
import routes from "./routes";

const app = express();

// Security headers
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(requestContext);

// Response compression
app.use(compression());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URLS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Global rate limiting
app.use("/api", globalLimiter);

// Health check
app.get("/api/health", getHealthStatus);
app.get("/api/health/live", getLivenessStatus);
app.get("/api/health/ready", getReadinessStatus);

// API Routes
app.use("/api", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handling
app.use(errorHandler);

export default app;
