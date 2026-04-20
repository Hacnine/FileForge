import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth";
import {
  getPublicPackages,
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats,
  getAuditLogs,
} from "../controllers/admin.controller";

const router = Router();

// Public
router.get("/packages/public", getPublicPackages);

// ── Subscription Packages (Admin) ───────────────────────────────────────────
router.post("/packages", authenticate, authorizeAdmin, createPackage);
router.get("/packages", authenticate, authorizeAdmin, getPackages);
router.get("/packages/:id", authenticate, authorizeAdmin, getPackageById);
router.put("/packages/:id", authenticate, authorizeAdmin, updatePackage);
router.delete("/packages/:id", authenticate, authorizeAdmin, deletePackage);

// ── User Management (Admin) ──────────────────────────────────────────────────
router.get("/users", authenticate, authorizeAdmin, getUsers);
router.get("/users/:id", authenticate, authorizeAdmin, getUserById);
router.put("/users/:id", authenticate, authorizeAdmin, updateUser);
router.delete("/users/:id", authenticate, authorizeAdmin, deleteUser);

// ── Analytics & Audit ───────────────────────────────────────────────────────
router.get("/stats", authenticate, authorizeAdmin, getStats);
router.get("/audit-logs", authenticate, authorizeAdmin, getAuditLogs);

export default router;