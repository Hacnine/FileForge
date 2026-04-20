// BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { execSync } from "child_process";
import app from "./app";
import { env } from "./config/env";
import prisma from "./config/database";

const runMigrations = () => {
  try {
    console.log("Running database migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Migrations applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    // Run migrations before anything else
    runMigrations();

    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");

    try {
      const { seedDatabase } = await import("./seed");
      await seedDatabase();
    } catch (seedError) {
      console.error("Seeding failed (non-fatal):", seedError);
    }

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
