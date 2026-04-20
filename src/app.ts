// BigInt JSON serialization (must be before any BigInt values hit res.json)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env";
import { errorHandler } from "./common/middleware/errorHandler";
import { globalLimiter } from "./common/middleware/rateLimiter";
import routes from "./routes";

const app = express();

// Security headers
app.set("trust proxy", 1);
app.use(helmet());

// Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Response compression
app.use(compression());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Global rate limiting
app.use("/api", globalLimiter);

// Health check
app.get("/api/health", async (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handling
app.use(errorHandler);

export default app;
