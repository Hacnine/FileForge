import { Request, Response } from "express";
import { checkDatabaseHealth } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../common/utils/logger";

const getBaseStatus = () => ({
  service: env.APP_NAME,
  timestamp: new Date().toISOString(),
  uptimeSeconds: Math.floor(process.uptime()),
});

const getDatabaseCheck = async () => {
  try {
    await checkDatabaseHealth();

    return {
      status: "ok",
    };
  } catch (error) {
    logger.error({ err: error }, "Database readiness check failed");

    return {
      status: "error",
    };
  }
};

export const getLivenessStatus = (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    status: "alive",
    ...getBaseStatus(),
  });
};

export const getReadinessStatus = async (_req: Request, res: Response) => {
  const database = await getDatabaseCheck();
  const isReady = database.status === "ok";

  return res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? "ready" : "degraded",
    ...getBaseStatus(),
    checks: {
      database,
    },
  });
};

export const getHealthStatus = async (_req: Request, res: Response) => {
  const database = await getDatabaseCheck();
  const isHealthy = database.status === "ok";

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "ok" : "degraded",
    ...getBaseStatus(),
    checks: {
      api: {
        status: "ok",
      },
      database,
    },
  });
};