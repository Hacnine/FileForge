import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import userRoutes from "./user.routes";
import { getPublicPackages } from "../controllers/admin.controller";
import { accessSharedFile } from "../controllers/files.controller";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);

// Public routes (no authentication required)
router.get("/packages", getPublicPackages);
router.get("/files/share/:token", accessSharedFile);

export default router;
