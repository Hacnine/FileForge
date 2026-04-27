import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkDatabaseHealth } = vi.hoisted(() => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock("../../src/config/database", () => ({
  default: {},
  checkDatabaseHealth,
}));

const loadApp = async () => {
  vi.resetModules();
  return (await import("../../src/app")).default;
};

describe("system health endpoints", () => {
  beforeEach(() => {
    checkDatabaseHealth.mockReset();
  });

  it("returns liveness and a request id", async () => {
    const app = await loadApp();

    const response = await request(app).get("/api/health/live");

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body).toMatchObject({
      success: true,
      status: "alive",
      service: "saas-file-management-backend-test",
    });
  });

  it("returns aggregated health when dependencies are ready", async () => {
    checkDatabaseHealth.mockResolvedValue(true);
    const app = await loadApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(checkDatabaseHealth).toHaveBeenCalledTimes(1);
    expect(response.body).toMatchObject({
      success: true,
      status: "ok",
      checks: {
        api: { status: "ok" },
        database: { status: "ok" },
      },
    });
  });

  it("returns readiness failure when the database probe fails", async () => {
    checkDatabaseHealth.mockRejectedValue(new Error("database unavailable"));
    const app = await loadApp();

    const response = await request(app).get("/api/health/ready");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: false,
      status: "degraded",
      checks: {
        database: { status: "error" },
      },
    });
  });
});