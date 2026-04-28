import { Router } from "express";
import { authenticate } from "../../common/middleware/auth";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from "./organizations.controller";

const router = Router();

router.use(authenticate);

// ── Organizations ─────────────────────────────────────────────────────────────
router.post("/", createOrganization);
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);
router.patch("/:id", updateOrganization);
router.delete("/:id", deleteOrganization);

// ── Members ───────────────────────────────────────────────────────────────────
router.get("/:id/members", getMembers);
router.post("/:id/members", addMember);
router.patch("/:id/members/:memberId", updateMemberRole);
router.delete("/:id/members/:memberId", removeMember);

export default router;
