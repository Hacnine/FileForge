import { Response, NextFunction } from "express";
import prisma from "../../config/database";
import { AppError } from "../../common/middleware/errorHandler";
import { AuthRequest } from "../../common/middleware/auth";
import { createAuditLog } from "../../common/utils/auditLog";

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60);

// ─── ORGANIZATIONS ────────────────────────────────────────────────────────────

export const createOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const { name, slug: customSlug } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return next(new AppError("Organization name is required", 400));
    }

    const slug = customSlug ? customSlug.trim() : toSlug(name.trim());

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      return next(new AppError("An organization with this slug already exists", 409));
    }

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        ownerId: userId,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });

    createAuditLog({ userId, action: "ORG_CREATED", resource: `org:${org.id}`, req });

    res.status(201).json({ success: true, organization: org });
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        isDeleted: false,
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, folders: true } },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, organizations });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        },
        _count: { select: { folders: true, files: true } },
      },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const isMember = org.members.some((m) => m.userId === userId);
    if (!isMember && req.user?.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }

    res.json({ success: true, organization: org });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;
    const { name, slug } = req.body;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const member = org.members[0];
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return next(new AppError("Only owners or admins can update the organization", 403));
    }

    const data: any = {};
    if (name) data.name = name.trim();
    if (slug) {
      const existing = await prisma.organization.findFirst({
        where: { slug: slug.trim(), NOT: { id } },
      });
      if (existing) return next(new AppError("Slug already taken", 409));
      data.slug = slug.trim();
    }

    const updated = await prisma.organization.update({ where: { id }, data });
    createAuditLog({ userId, action: "ORG_UPDATED", resource: `org:${id}`, req });

    res.json({ success: true, organization: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    if (org.ownerId !== userId && req.user?.role !== "ADMIN") {
      return next(new AppError("Only the owner can delete the organization", 403));
    }

    await prisma.organization.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });

    createAuditLog({ userId, action: "ORG_DELETED", resource: `org:${id}`, req });

    res.json({ success: true, message: "Organization deleted" });
  } catch (error) {
    next(error);
  }
};

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export const getMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const isMember = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: id } },
    });
    if (!isMember && req.user?.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, members });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;
    const { email, role = "MEMBER" } = req.body;

    if (!email) return next(new AppError("Email is required", 400));

    const validRoles = ["ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return next(new AppError(`Invalid role. Allowed: ${validRoles.join(", ")}`, 400));
    }

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const requester = org.members[0];
    if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
      return next(new AppError("Only owners or admins can add members", 403));
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) return next(new AppError("User not found", 404));

    const existing = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: targetUser.id, organizationId: id } },
    });
    if (existing) return next(new AppError("User is already a member", 409));

    const member = await prisma.organizationMember.create({
      data: { userId: targetUser.id, organizationId: id, role: role as any },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    createAuditLog({
      userId,
      action: "ORG_MEMBER_ADDED",
      resource: `org:${id}`,
      metadata: { addedUserId: targetUser.id, role },
      req,
    });

    res.status(201).json({ success: true, member });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    const validRoles = ["ADMIN", "MEMBER", "VIEWER"];
    if (!validRoles.includes(role)) {
      return next(new AppError(`Invalid role. Allowed: ${validRoles.join(", ")}`, 400));
    }

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const requester = org.members[0];
    if (!requester || requester.role !== "OWNER") {
      return next(new AppError("Only the owner can change member roles", 403));
    }

    const target = await prisma.organizationMember.findUnique({ where: { id: memberId } });
    if (!target || target.organizationId !== id) {
      return next(new AppError("Member not found", 404));
    }
    if (target.role === "OWNER") {
      return next(new AppError("Cannot change the owner's role", 400));
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: role as any },
      include: { user: { select: { id: true, email: true } } },
    });

    res.json({ success: true, member: updated });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { userId } } },
    });

    if (!org || org.isDeleted) return next(new AppError("Organization not found", 404));

    const requester = org.members[0];
    if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
      return next(new AppError("Only owners or admins can remove members", 403));
    }

    const target = await prisma.organizationMember.findUnique({ where: { id: memberId } });
    if (!target || target.organizationId !== id) {
      return next(new AppError("Member not found", 404));
    }
    if (target.role === "OWNER") {
      return next(new AppError("Cannot remove the organization owner", 400));
    }

    await prisma.organizationMember.delete({ where: { id: memberId } });

    createAuditLog({
      userId,
      action: "ORG_MEMBER_REMOVED",
      resource: `org:${id}`,
      metadata: { removedMemberId: memberId },
      req,
    });

    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    next(error);
  }
};
