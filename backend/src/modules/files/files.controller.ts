import { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import prisma from "../../config/database";
import { AppError } from "../../common/middleware/errorHandler";
import { AuthRequest } from "../../common/middleware/auth";
import { createAuditLog } from "../../common/utils/auditLog";
import { decrementStorageUsed } from "../../common/utils/storage";

export const downloadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId || file.isDeleted) {
      return next(new AppError("File not found", 404));
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return next(new AppError("File not found on disk", 404));
    }

    await prisma.file.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });

    createAuditLog({
      userId,
      action: "FILE_DOWNLOAD",
      resource: `file:${id}`,
      metadata: { fileName: file.originalName },
      req,
    });

    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
    res.setHeader("Content-Type", file.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

export const createShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId || file.isDeleted) {
      return next(new AppError("File not found", 404));
    }

    const { expiresAt, maxUses, password } = req.body;

    const shareLink = await prisma.shareLink.create({
      data: {
        fileId: id,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses ?? null,
        password: password ?? null,
      },
    });

    createAuditLog({
      userId,
      action: "SHARE_LINK_CREATED",
      resource: `file:${id}`,
      metadata: { token: shareLink.token },
      req,
    });

    res.status(201).json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        expiresAt: shareLink.expiresAt,
        maxUses: shareLink.maxUses,
        useCount: shareLink.useCount,
        isActive: shareLink.isActive,
        url: `/api/files/share/${shareLink.token}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getShareLinks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      return next(new AppError("File not found", 404));
    }

    const shareLinks = await prisma.shareLink.findMany({
      where: { fileId: id, userId, isDeleted: false },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        maxUses: true,
        useCount: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, shareLinks });
  } catch (error) {
    next(error);
  }
};

export const revokeShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawLinkId = req.params.linkId;
    const linkId = Array.isArray(rawLinkId) ? rawLinkId[0] : rawLinkId;

    const link = await prisma.shareLink.findUnique({ where: { id: linkId } });
    if (!link || link.userId !== userId) {
      return next(new AppError("Share link not found", 404));
    }

    await prisma.shareLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });

    createAuditLog({
      userId,
      action: "SHARE_LINK_REVOKED",
      resource: `shareLink:${linkId}`,
      req,
    });

    res.json({ success: true, message: "Share link revoked" });
  } catch (error) {
    next(error);
  }
};

export const accessSharedFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawToken = req.params.token;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: { file: true },
    });

    if (!shareLink || !shareLink.isActive || shareLink.isDeleted) {
      return next(new AppError("Share link not found or inactive", 404));
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return next(new AppError("Share link has expired", 410));
    }

    if (shareLink.maxUses && shareLink.useCount >= shareLink.maxUses) {
      return next(new AppError("Share link has reached its maximum uses", 410));
    }

    if (shareLink.password) {
      const { password } = req.query;
      if (!password || password !== shareLink.password) {
        return next(new AppError("Password required or incorrect", 401));
      }
    }

    const file = shareLink.file;
    if (!file || file.isDeleted) {
      return next(new AppError("File not available", 404));
    }

    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return next(new AppError("File not found on disk", 404));
    }

    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { useCount: { increment: 1 } },
    });

    await prisma.file.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    });

    res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
    res.setHeader("Content-Type", file.mimeType);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

// Returns file + share-link metadata WITHOUT downloading the file.
// Used by the Next.js /share/[token] page to render a preview before the user downloads.
export const getShareLinkInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawToken = req.params.token;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        file: {
          select: {
            originalName: true,
            mimeType: true,
            size: true,
            fileType: true,
          },
        },
      },
    });

    if (!shareLink || !shareLink.isActive || shareLink.isDeleted) {
      return next(new AppError("Share link not found or inactive", 404));
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return next(new AppError("Share link has expired", 410));
    }

    if (shareLink.maxUses && shareLink.useCount >= shareLink.maxUses) {
      return next(new AppError("Share link has reached its maximum uses", 410));
    }

    const file = shareLink.file;

    res.json({
      success: true,
      info: {
        fileName: file.originalName,
        mimeType: file.mimeType,
        size: file.size.toString(),
        fileType: file.fileType,
        expiresAt: shareLink.expiresAt?.toISOString() ?? null,
        hasPassword: !!shareLink.password,
        maxUses: shareLink.maxUses,
        useCount: shareLink.useCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStorageInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageUsed: true,
        activePackage: {
          select: { storageLimit: true, maxFileSize: true, totalFileLimit: true },
        },
      },
    });

    const fileCount = await prisma.file.count({
      where: { userId, isDeleted: false },
    });

    const storageUsed = user?.storageUsed ?? BigInt(0);
    const storageLimit = user?.activePackage?.storageLimit ?? BigInt(0);

    res.json({
      success: true,
      storage: {
        used: storageUsed.toString(),
        limit: storageLimit.toString(),
        usedPercentage:
          storageLimit > BigInt(0)
            ? Number((storageUsed * BigInt(100)) / storageLimit)
            : 0,
        fileCount,
        maxFileSize: user?.activePackage?.maxFileSize ?? null,
        totalFileLimit: user?.activePackage?.totalFileLimit ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTrash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const [files, folders] = await Promise.all([
      prisma.file.findMany({
        where: { userId, isDeleted: true },
        select: {
          id: true,
          name: true,
          originalName: true,
          size: true,
          fileType: true,
          mimeType: true,
          deletedAt: true,
        },
        orderBy: { deletedAt: "desc" },
      }),
      prisma.folder.findMany({
        where: { userId, isDeleted: true },
        select: { id: true, name: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      trash: {
        files: files.map((f) => ({ ...f, size: f.size.toString() })),
        folders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const restoreFromTrash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { type, id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;

    if (type === "file") {
      const file = await prisma.file.findUnique({ where: { id: itemId } });
      if (!file || file.userId !== userId || !file.isDeleted) {
        return next(new AppError("File not found in trash", 404));
      }
      await prisma.file.update({
        where: { id: itemId },
        data: { isDeleted: false, deletedAt: null },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { storageUsed: { increment: file.size } },
      });
      createAuditLog({ userId, action: "FILE_RESTORE", resource: `file:${itemId}`, req });
      return res.json({ success: true, message: "File restored" });
    }

    if (type === "folder") {
      const folder = await prisma.folder.findUnique({ where: { id: itemId } });
      if (!folder || folder.userId !== userId || !folder.isDeleted) {
        return next(new AppError("Folder not found in trash", 404));
      }
      await prisma.folder.update({
        where: { id: itemId },
        data: { isDeleted: false, deletedAt: null },
      });
      createAuditLog({ userId, action: "FOLDER_RESTORE", resource: `folder:${itemId}`, req });
      return res.json({ success: true, message: "Folder restored" });
    }

    return next(new AppError("Invalid type. Must be 'file' or 'folder'", 400));
  } catch (error) {
    next(error);
  }
};

export const emptyTrash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const trashedFiles = await prisma.file.findMany({
      where: { userId, isDeleted: true },
      select: { id: true, path: true },
    });

    for (const f of trashedFiles) {
      try {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      } catch {
        // disk deletion is best-effort
      }
    }

    await prisma.file.deleteMany({ where: { userId, isDeleted: true } });
    await prisma.folder.deleteMany({ where: { userId, isDeleted: true } });

    res.json({
      success: true,
      message: `Trash emptied. ${trashedFiles.length} file(s) permanently deleted.`,
    });
  } catch (error) {
    next(error);
  }
};

export const search = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const type = typeof req.query.type === "string" ? req.query.type : "all";
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.json({ success: true, results: { files: [], folders: [] } });
    }

    const [files, folders] = await Promise.all([
      type !== "folder"
        ? prisma.file.findMany({
            where: {
              userId,
              isDeleted: false,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { originalName: { contains: q, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              name: true,
              originalName: true,
              size: true,
              fileType: true,
              mimeType: true,
              downloadCount: true,
              folderId: true,
              createdAt: true,
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : [],
      type !== "file"
        ? prisma.folder.findMany({
            where: {
              userId,
              isDeleted: false,
              name: { contains: q, mode: "insensitive" },
            },
            select: {
              id: true,
              name: true,
              description: true,
              nestingLevel: true,
              parentId: true,
              createdAt: true,
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : [],
    ]);

    res.json({
      success: true,
      results: {
        files: (files as any[]).map((f: any) => ({ ...f, size: f.size?.toString() })),
        folders,
      },
      query: q,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const note = await prisma.notification.findUnique({ where: { id } });
    if (!note || note.userId !== userId) {
      return next(new AppError("Notification not found", 404));
    }

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const result = await prisma.notification.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      return next(new AppError("Notification not found", 404));
    }
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

export const getTags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const tags = await prisma.tag.findMany({
      where: { userId, isDeleted: false },
      include: { _count: { select: { fileTags: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, tags });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { name, color } = req.body;
    const tag = await prisma.tag.create({
      data: { name: name.trim(), color: color ?? "#6366f1", userId },
    });
    res.status(201).json({ success: true, tag });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return next(new AppError("A tag with this name already exists", 409));
    }
    next(error);
  }
};

export const deleteTag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    // Soft-delete the tag
    const result = await prisma.tag.updateMany({
      where: { id, userId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    if (result.count === 0) {
      return next(new AppError("Tag not found", 404));
    }
    res.json({ success: true, message: "Tag deleted" });
  } catch (error) {
    next(error);
  }
};

export const addTagToFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const fileId = Array.isArray(rawId) ? rawId[0] : rawId;
    const { tagId } = req.body;

    if (!tagId) return next(new AppError("Tag ID is required", 400));

    const [file, tag] = await Promise.all([
      prisma.file.findUnique({ where: { id: fileId } }),
      prisma.tag.findUnique({ where: { id: tagId } }),
    ]);

    if (!file || file.userId !== userId || file.isDeleted) {
      return next(new AppError("File not found", 404));
    }
    if (!tag || tag.userId !== userId) {
      return next(new AppError("Tag not found", 404));
    }

    await prisma.fileTag.upsert({
      where: { fileId_tagId: { fileId, tagId } },
      update: {},
      create: { fileId, tagId },
    });

    res.status(201).json({ success: true, message: "Tag added to file" });
  } catch (error) {
    next(error);
  }
};

export const removeTagFromFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const fileId = Array.isArray(rawId) ? rawId[0] : rawId;
    const rawTagId = req.params.tagId;
    const tagId = Array.isArray(rawTagId) ? rawTagId[0] : rawTagId;

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== userId) {
      return next(new AppError("File not found", 404));
    }

    await prisma.fileTag.deleteMany({ where: { fileId, tagId } });
    res.json({ success: true, message: "Tag removed from file" });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { firstName, lastName } = req.body;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        storageUsed: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    createAuditLog({ userId, action: "USER_UPDATED", req });

    res.json({ success: true, user: { ...updated, storageUsed: updated.storageUsed.toString() } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new AppError("User not found", 404));

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return next(new AppError("Current password is incorrect", 400));

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, refreshToken: null },
    });

    createAuditLog({ userId, action: "PASSWORD_CHANGED", req });

    res.json({ success: true, message: "Password changed successfully. Please login again." });
  } catch (error) {
    next(error);
  }
};
