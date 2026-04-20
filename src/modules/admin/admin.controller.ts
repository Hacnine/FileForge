import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database";
import { AppError } from "../../common/middleware/errorHandler";
import { AuthRequest } from "../../common/middleware/auth";
import { createAuditLog } from "../../common/utils/auditLog";

// Public endpoint – no auth required
export const getPublicPackages = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
    });
    res.json(packages);
  } catch (error) {
    next(new AppError("Failed to retrieve packages", 500));
  }
};

export const getPackages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Only admins can view all packages", 403));
  }
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      include: { _count: { select: { activeUsers: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(packages);
  } catch (error) {
    next(new AppError("Failed to retrieve packages", 500));
  }
};

export const getPackageById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Only admins can view package details", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Package ID is required", 400));

    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id },
      include: { _count: { select: { activeUsers: true } } },
    });

    if (!pkg) return next(new AppError("Package not found", 404));
    res.status(200).json(pkg);
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Only admins can create packages", 403));
  }
  try {
    const {
      name,
      maxFolders,
      maxNestingLevel,
      allowedFileTypes,
      maxFileSize,
      totalFileLimit,
      filesPerFolder,
    } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return next(new AppError("Package name is required and must be valid", 400));
    }
    if (
      maxFolders === undefined ||
      maxNestingLevel === undefined ||
      !allowedFileTypes ||
      maxFileSize === undefined ||
      totalFileLimit === undefined ||
      filesPerFolder === undefined
    ) {
      return next(new AppError("All package limits and settings are required", 400));
    }
    if (!Array.isArray(allowedFileTypes) || allowedFileTypes.length === 0) {
      return next(new AppError("Allowed file types must be a non-empty array", 400));
    }

    const existing = await prisma.subscriptionPackage.findUnique({
      where: { name: name.trim() },
    });
    if (existing) return next(new AppError("Package name already exists", 409));

    const newPackage = await prisma.subscriptionPackage.create({
      data: {
        name: name.trim(),
        description: req.body.description ?? null,
        price: req.body.price ?? 0,
        maxFolders: parseInt(maxFolders),
        maxNestingLevel: parseInt(maxNestingLevel),
        allowedFileTypes,
        maxFileSize: parseInt(maxFileSize),
        totalFileLimit: parseInt(totalFileLimit),
        filesPerFolder: parseInt(filesPerFolder),
        storageLimit: req.body.storageLimit ? BigInt(req.body.storageLimit) : BigInt(0),
      },
    });
    res.status(201).json(newPackage);
  } catch (error) {
    next(new AppError("Failed to create package", 500));
  }
};

export const updatePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Only admins can update packages", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Package ID is required", 400));

    const existing = await prisma.subscriptionPackage.findUnique({
      where: { id: String(id) },
    });
    if (!existing) return next(new AppError("Package not found", 404));

    const {
      name,
      maxFolders,
      maxNestingLevel,
      allowedFileTypes,
      maxFileSize,
      totalFileLimit,
      filesPerFolder,
    } = req.body;

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return next(new AppError("Package name must be a non-empty string", 400));
      }
      const duplicate = await prisma.subscriptionPackage.findFirst({
        where: { name: name.trim(), NOT: { id: String(id) } },
      });
      if (duplicate) return next(new AppError("Package name already exists", 409));
      updateData.name = name.trim();
    }

    if (maxFolders !== undefined) updateData.maxFolders = parseInt(maxFolders);
    if (maxNestingLevel !== undefined) updateData.maxNestingLevel = parseInt(maxNestingLevel);
    if (allowedFileTypes !== undefined) {
      if (!Array.isArray(allowedFileTypes) || allowedFileTypes.length === 0) {
        return next(new AppError("Allowed file types must be a non-empty array", 400));
      }
      const validFileTypes = ["IMAGE", "VIDEO", "PDF", "AUDIO", "OTHER"];
      for (const type of allowedFileTypes) {
        if (!validFileTypes.includes(type)) {
          return next(new AppError(`Invalid file type: ${type}`, 400));
        }
      }
      updateData.allowedFileTypes = allowedFileTypes;
    }
    if (maxFileSize !== undefined) updateData.maxFileSize = parseInt(maxFileSize);
    if (totalFileLimit !== undefined) updateData.totalFileLimit = parseInt(totalFileLimit);
    if (filesPerFolder !== undefined) updateData.filesPerFolder = parseInt(filesPerFolder);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.price !== undefined) updateData.price = req.body.price;
    if (req.body.storageLimit !== undefined) updateData.storageLimit = BigInt(req.body.storageLimit);
    if (typeof req.body.isActive === "boolean") updateData.isActive = req.body.isActive;

    const updated = await prisma.subscriptionPackage.update({
      where: { id: String(id) },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    next(new AppError("Failed to update package", 500));
  }
};

export const deletePackage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Only admins can delete packages", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) return next(new AppError("Package ID is required", 400));

    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: String(id) },
      select: { _count: { select: { activeUsers: true } } },
    });

    if (!pkg) return next(new AppError("Package not found", 404));

    if (pkg._count.activeUsers > 0) {
      return next(
        new AppError(
          "Cannot delete a package that has active users. Please reassign or unsubscribe all users first.",
          409
        )
      );
    }

    await prisma.subscriptionPackage.delete({ where: { id: String(id) } });
    res.status(204).send();
  } catch (error) {
    next(new AppError("Failed to delete package", 500));
  }
};

// ─── USER MANAGEMENT ──────────────────────────────────────────────────────────

export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role === "ADMIN" || role === "USER") where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          storageUsed: true,
          lastLoginAt: true,
          createdAt: true,
          activePackage: { select: { id: true, name: true } },
          _count: { select: { files: true, folders: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users: users.map((u) => ({ ...u, storageUsed: u.storageUsed.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        storageUsed: true,
        lastLoginAt: true,
        createdAt: true,
        activePackage: { select: { id: true, name: true, storageLimit: true } },
        subscriptionHistory: {
          include: { package: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { files: true, folders: true } },
      },
    });

    if (!user) return next(new AppError("User not found", 404));

    res.json({ success: true, user: { ...user, storageUsed: user.storageUsed.toString() } });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { role, isActive, firstName, lastName } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError("User not found", 404));

    if (id === req.user.id && role === "USER") {
      return next(new AppError("Cannot change your own admin role", 400));
    }

    const data: any = {};
    if (role === "ADMIN" || role === "USER") data.role = role;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (firstName) data.firstName = firstName.trim();
    if (lastName) data.lastName = lastName.trim();

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    createAuditLog({
      userId: req.user.id,
      action: "USER_UPDATED",
      resource: `user:${id}`,
      metadata: { changes: data },
      req,
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (id === req.user.id) {
      return next(new AppError("Cannot delete your own account", 400));
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new AppError("User not found", 404));

    await prisma.user.delete({ where: { id } });

    createAuditLog({
      userId: req.user.id,
      action: "USER_DELETED",
      resource: `user:${id}`,
      metadata: { deletedEmail: user.email },
      req,
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ─── STATS & ANALYTICS ────────────────────────────────────────────────────────

export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const [
      totalUsers,
      activeUsers,
      totalFiles,
      totalFolders,
      totalPackages,
      storageResult,
      recentUsers,
      fileTypeBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.file.count({ where: { isDeleted: false } }),
      prisma.folder.count({ where: { isDeleted: false } }),
      prisma.subscriptionPackage.count({ where: { isActive: true } }),
      prisma.user.aggregate({ _sum: { storageUsed: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
      prisma.file.groupBy({
        by: ["fileType"],
        where: { isDeleted: false },
        _count: { id: true },
        _sum: { size: true },
      }),
    ]);

    const subscriptionBreakdown = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      include: { _count: { select: { activeUsers: true } } },
    });

    const totalOrganizations = await prisma.organization.count({ where: { isDeleted: false } });

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, active: activeUsers },
        files: totalFiles,
        folders: totalFolders,
        packages: totalPackages,
        organizations: totalOrganizations,
        totalStorageUsed: (storageResult._sum.storageUsed ?? BigInt(0)).toString(),
        subscriptionBreakdown: subscriptionBreakdown.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          activeUsers: p._count.activeUsers,
        })),
        fileTypeBreakdown: fileTypeBreakdown.map((f) => ({
          type: f.fileType,
          count: f._count.id,
          totalSize: (f._sum.size ?? BigInt(0)).toString(),
        })),
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const action = typeof req.query.action === "string" ? req.query.action : undefined;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── STORAGE PROVIDERS ────────────────────────────────────────────────────────

export const getStorageProviders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const providers = await prisma.storageProvider.findMany({
      include: { _count: { select: { files: true } } },
    });
    res.json({ success: true, providers });
  } catch (error) {
    next(error);
  }
};

export const createStorageProvider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403));
  }
  try {
    const { name, type, bucket, region, endpoint } = req.body;
    if (!name || !type) {
      return next(new AppError("Name and type are required", 400));
    }
    const validTypes = ["s3", "gcs", "azure", "local"];
    if (!validTypes.includes(type)) {
      return next(new AppError(`Invalid type. Allowed: ${validTypes.join(", ")}`, 400));
    }

    const provider = await prisma.storageProvider.create({
      data: { name, type, bucket: bucket ?? null, region: region ?? null, endpoint: endpoint ?? null },
    });
    res.status(201).json({ success: true, provider });
  } catch (error) {
    next(error);
  }
};
