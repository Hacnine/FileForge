import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authLimiter, uploadLimiter, shareLimiter } from "../middleware/rateLimiter";
import multer from "multer";
import path from "path";
import {
  subscribePackage,
  unsubscribePackage,
  getSubscriptionHistory,
  getSubscriptionStatus,
  createFolder,
  createSubFolder,
  getFolders,
  deleteFolder,
  renameFolder,
  moveFolder,
  uploadFile,
  getFilesByFolder,
  renameFile,
  moveFile,
  deleteFile,
} from "../controllers/user.contoller";
import {
  downloadFile,
  createShareLink,
  getShareLinks,
  revokeShareLink,
  getStorageInfo,
  getTrash,
  restoreFromTrash,
  emptyTrash,
  search,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getTags,
  createTag,
  deleteTag,
  addTagToFile,
  removeTagFromFile,
  updateProfile,
  changePassword,
} from "../controllers/files.controller";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600 MB hard limit (package enforces lower limits)
});

const router = Router();

// ── Profile ──────────────────────────────────────────────────────────────────
router.patch("/profile", authenticate, updateProfile);
router.put("/password", authenticate, authLimiter, changePassword);
router.get("/storage", authenticate, getStorageInfo);

// ── Subscription ─────────────────────────────────────────────────────────────
router.post("/subscribe", authenticate, subscribePackage);
router.post("/unsubscribe", authenticate, unsubscribePackage);
router.get("/subscription-history", authenticate, getSubscriptionHistory);
router.get("/subscription-status", authenticate, getSubscriptionStatus);

// ── Folders ──────────────────────────────────────────────────────────────────
router.post("/folders", authenticate, createFolder);
router.post("/folders/sub", authenticate, createSubFolder);
router.get("/folders", authenticate, getFolders);
router.delete("/folders/:id", authenticate, deleteFolder);
router.patch("/folders/:id/rename", authenticate, renameFolder);
router.patch("/folders/:id/move", authenticate, moveFolder);

// ── Files ────────────────────────────────────────────────────────────────────
router.post("/files/upload", authenticate, uploadLimiter, upload.single("file"), uploadFile);
router.get("/files/folder/:folderId", authenticate, getFilesByFolder);
router.get("/files/:id/download", authenticate, downloadFile);
router.patch("/files/:id/rename", authenticate, renameFile);
router.patch("/files/:id/move", authenticate, moveFile);
router.delete("/files/:id", authenticate, deleteFile);

// ── File Sharing ─────────────────────────────────────────────────────────────
router.post("/files/:id/share", authenticate, shareLimiter, createShareLink);
router.get("/files/:id/share-links", authenticate, getShareLinks);
router.delete("/files/:id/share-links/:linkId", authenticate, revokeShareLink);

// ── File Tags ────────────────────────────────────────────────────────────────
router.post("/files/:id/tags", authenticate, addTagToFile);
router.delete("/files/:id/tags/:tagId", authenticate, removeTagFromFile);

// ── Trash ────────────────────────────────────────────────────────────────────
router.get("/trash", authenticate, getTrash);
router.post("/trash/restore/:type/:id", authenticate, restoreFromTrash);
router.delete("/trash", authenticate, emptyTrash);

// ── Search ───────────────────────────────────────────────────────────────────
router.get("/search", authenticate, search);

// ── Tags ─────────────────────────────────────────────────────────────────────
router.get("/tags", authenticate, getTags);
router.post("/tags", authenticate, createTag);
router.delete("/tags/:id", authenticate, deleteTag);

// ── Notifications ────────────────────────────────────────────────────────────
router.get("/notifications", authenticate, getNotifications);
router.patch("/notifications/read-all", authenticate, markAllNotificationsRead);
router.patch("/notifications/:id/read", authenticate, markNotificationRead);
router.delete("/notifications/:id", authenticate, deleteNotification);

export default router;
