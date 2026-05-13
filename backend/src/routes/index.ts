import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import adminRoutes from "../modules/admin/admin.routes";
import userRoutes from "../modules/users/users.routes";
import orgRoutes from "../modules/organizations/organizations.routes";
import billingRoutes from "../modules/billing/billing.routes";
import { getPublicPackages } from "../modules/admin/admin.controller";
import { accessSharedFile, getShareLinkInfo } from "../modules/files/files.controller";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/organizations", orgRoutes);
router.use("/organizations/:orgId/billing", billingRoutes);

// Public routes (no authentication required)
router.get("/packages", getPublicPackages);
router.get("/files/share/:token/info", getShareLinkInfo); // metadata — no download, no use-count increment
router.get("/files/share/:token", accessSharedFile);      // actual file download

export default router;
