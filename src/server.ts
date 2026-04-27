import { execSync } from "child_process";
import { Server } from "http";
import app from "./app";
import { env } from "./config/env";
import prisma from "./config/database";
import { logger } from "./common/utils/logger";

const runMigrations = () => {
  try {
    logger.info("Running database migrations");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    logger.info("Database migrations applied successfully");
  } catch (error) {
    logger.fatal({ err: error }, "Database migration failed");
    process.exit(1);
  }
};

let server: Server | undefined;

const shutdown = async (reason: string, exitCode = 0) => {
  try {
    logger.info({ reason }, "Shutting down server");

    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(exitCode);
  } catch (error) {
    logger.error({ err: error, reason }, "Shutdown failed");
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    // Run migrations before anything else
    runMigrations();

    // Test database connection
    await prisma.$connect();
    logger.info("Database connected successfully");

    try {
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    } catch (seedError) {
      logger.error({ err: seedError }, "Seeding failed (non-fatal)");
    }

    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
        },
        "Server started"
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await shutdown("SIGINT");
});

process.on("SIGTERM", async () => {
  await shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  void shutdown("uncaughtException", 1);
});

startServer();
