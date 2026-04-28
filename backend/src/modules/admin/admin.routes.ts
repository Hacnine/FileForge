import { Router } from "express";
import { authenticate, authorizeAdmin } from "../../common/middleware/auth";
import {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
  getAuditLogs,
  getStorageProviders,
  createStorageProvider,
} from "./admin.controller";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorizeAdmin);

// ── Packages ──────────────────────────────────────────────────────────────────
router.get("/packages", getPackages);
router.get("/packages/:id", getPackageById);
router.post("/packages", createPackage);
router.put("/packages/:id", updatePackage);
router.delete("/packages/:id", deletePackage);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/stats", getStats);
router.get("/audit-logs", getAuditLogs);

// ── Storage Providers ─────────────────────────────────────────────────────────
router.get("/storage-providers", getStorageProviders);
router.post("/storage-providers", createStorageProvider);

export default router;
