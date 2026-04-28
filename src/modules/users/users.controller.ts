import { Response, NextFunction } from "express";
import prisma from "../../config/database";
import { AppError } from "../../common/middleware/errorHandler";
import { AuthRequest } from "../../common/middleware/auth";
import {
  validateFolderCreation,
  validateFileUpload,
  calculateNestingLevel,
  getSubscriptionInfo,
} from "../../common/utils/subscriptionEnforcer";
import { createAuditLog } from "../../common/utils/auditLog";
import { incrementStorageUsed, decrementStorageUsed } from "../../common/utils/storage";

export const subscribePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { packageId } = req.body;
    if (!packageId) throw new AppError("Package ID is required", 400);

    const subscriptionPackage = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });
    if (!subscriptionPackage) {
      throw new AppError("Subscription package not found", 404);
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { activePackageId: true },
    });
    if (userRecord?.activePackageId) {
      return next(
        new AppError(
          "You already have an active subscription. Cancel it before subscribing to a new plan.",
          400
        )
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        activePackageId: packageId,
        subscriptionHistory: { create: { packageId } },
      },
    });
    createAuditLog({
      userId,
      action: "SUBSCRIPTION_CHANGED",
      resource: `package:${packageId}`,
      req,
    });
    res.status(200).json({ message: "Subscription package updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { activePackageId: null },
    });
    res.status(200).json({ message: "Subscription package removed successfully" });
  } catch (error) {
    next(new AppError("Failed to unsubscribe from package", 500));
  }
};

export const getSubscriptionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const history = await prisma.subscriptionHistory.findMany({
      where: { userId },
      include: { package: true },
    });
    res.status(200).json({ history });
  } catch (error) {
    next(new AppError("Failed to retrieve subscription history", 500));
  }
};

export const createFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { name } = req.body;
    if (!name) throw new AppError("Folder name is required", 400);

    await validateFolderCreation(userId);

    const newFolder = await prisma.folder.create({
      data: {
        name,
        userId,
        nestingLevel: 1,
        path: `/${name}`,
      },
    });
    createAuditLog({ userId, action: "FOLDER_CREATE", resource: `folder:${newFolder.id}`, req });
    res.status(201).json({ folder: newFolder });
  } catch (error) {
    next(error);
  }
};

export const createSubFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { name, parentId } = req.body;
    if (!name) throw new AppError("Folder name is required", 400);

    let parentPath = "";
    if (parentId) {
      const parent = await prisma.folder.findUnique({ where: { id: parentId } });
      if (!parent || parent.userId !== userId) {
        return next(new AppError("Parent folder not found or not owned by user", 404));
      }
      parentPath = parent.path ?? `/${parent.name}`;
    }

    await validateFolderCreation(userId, parentId);

    const nestingLevel = await calculateNestingLevel(parentId);

    const newFolder = await prisma.folder.create({
      data: {
        name,
        parentId,
        userId,
        nestingLevel,
        path: `${parentPath}/${name}`,
      },
    });
    createAuditLog({ userId, action: "FOLDER_CREATE", resource: `folder:${newFolder.id}`, req });
    res.status(201).json({ folder: newFolder });
  } catch (error) {
    next(error);
  }
};

export const getFolders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const folders = await prisma.folder.findMany({
      where: { userId, isDeleted: false },
      include: {
        _count: { select: { files: true, children: true } },
      },
    });
    res.status(200).json({ folders });
  } catch (error) {
    next(error);
  }
};

export const deleteFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Folder ID is required", 400));

    const result = await prisma.folder.updateMany({
      where: { id, userId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    if (result.count === 0) {
      return next(new AppError("Folder not found or not owned by user", 404));
    }

    createAuditLog({ userId, action: "FOLDER_DELETE", resource: `folder:${id}`, req });
    res.status(200).json({ message: "Folder moved to trash" });
  } catch (error) {
    next(error);
  }
};

export const renameFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Folder ID is required", 400));

    const { name } = req.body;
    if (!name) throw new AppError("Folder name is required", 400);

    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder || folder.userId !== userId || folder.isDeleted) {
      return next(new AppError("Folder not found or not owned by user", 404));
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name },
    });

    createAuditLog({ userId, action: "FOLDER_RENAME", resource: `folder:${id}`, req });
    res.status(200).json({ folder: updatedFolder });
  } catch (error) {
    next(error);
  }
};

export const moveFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Folder ID is required", 400));
    if (!req.user) return next(new AppError("Unauthorized", 401));
    const userId = req.user.id;

    const { newParentId } = req.body;
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder || folder.userId !== userId) {
      return next(new AppError("Folder not found or not owned by user", 404));
    }

    if (newParentId) {
      const parent = await prisma.folder.findUnique({ where: { id: newParentId } });
      if (!parent || parent.userId !== userId) {
        return next(new AppError("New parent folder not found or not owned by user", 404));
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { parentId: newParentId },
    });
    createAuditLog({ userId, action: "FOLDER_MOVE", resource: `folder:${id}`, req });
    res.status(200).json({ folder: updatedFolder });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const file = (req as any).file;
    if (!file) return next(new AppError("No file uploaded", 400));
    const { folderId } = req.body;
    if (!folderId) return next(new AppError("Folder ID is required", 400));

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
      return next(new AppError("Folder not found or not owned by user", 404));
    }

    const { fileType } = await validateFileUpload(
      userId,
      file.size,
      file.mimetype || "",
      folderId
    );

    const created = await prisma.file.create({
      data: {
        name: file.filename || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: BigInt(file.size),
        path: file.path,
        fileType,
        userId,
        folderId,
      },
    });

    await incrementStorageUsed(userId, file.size);

    createAuditLog({
      userId,
      action: "FILE_UPLOAD",
      resource: `file:${created.id}`,
      metadata: { fileName: file.originalname, size: file.size },
      req,
    });

    res.status(201).json({
      message: "File uploaded successfully",
      file: { ...created, size: created.size.toString() },
    });
  } catch (error) {
    next(error);
  }
};

export const getFilesByFolder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawFolderId = req.params.folderId;
    const folderId = Array.isArray(rawFolderId) ? rawFolderId[0] : rawFolderId;
    if (!folderId) return next(new AppError("Folder ID is required", 400));

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
      return next(new AppError("Folder not found or not owned by user", 404));
    }

    const files = await prisma.file.findMany({
      where: { folderId, userId, isDeleted: false },
      include: { fileTags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      files: files.map((f) => ({ ...f, size: f.size.toString() })),
    });
  } catch (error) {
    next(error);
  }
};

export const renameFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("File ID is required", 400));

    const { name } = req.body;
    if (!name) throw new AppError("File name is required", 400);

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      return next(new AppError("File not found or not owned by user", 404));
    }

    const updated = await prisma.file.update({
      where: { id },
      data: { name },
    });
    createAuditLog({ userId, action: "FILE_RENAME", resource: `file:${id}`, req });
    res.status(200).json({ file: { ...updated, size: updated.size.toString() } });
  } catch (error) {
    next(error);
  }
};

export const moveFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("File ID is required", 400));

    const { folderId } = req.body;
    if (!folderId) return next(new AppError("Folder ID is required", 400));

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      return next(new AppError("File not found or not owned by user", 404));
    }

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
      return next(new AppError("Target folder not found or not owned by user", 404));
    }

    const updated = await prisma.file.update({
      where: { id },
      data: { folderId },
    });
    createAuditLog({ userId, action: "FILE_MOVE", resource: `file:${id}`, req });
    res.status(200).json({ file: { ...updated, size: updated.size.toString() } });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("File ID is required", 400));
    if (!req.user) return next(new AppError("Unauthorized", 401));
    const userId = req.user.id;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.userId !== userId || file.isDeleted) {
      return next(new AppError("File not found or not owned by user", 404));
    }

    await prisma.file.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await decrementStorageUsed(userId, file.size);

    createAuditLog({ userId, action: "FILE_DELETE", resource: `file:${id}`, req });

    res.status(200).json({ message: "File moved to trash" });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const info = await getSubscriptionInfo(userId);
    if (!info) {
      return res.status(200).json({
        hasActivePackage: false,
        message: "No active subscription package",
      });
    }

    res.status(200).json({
      hasActivePackage: true,
      ...info,
    });
  } catch (error) {
    next(error);
  }
};
