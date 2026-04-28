import { Response, NextFunction } from "express";
import prisma from "../../config/database";
import { AppError } from "../../common/middleware/errorHandler";
import { AuthRequest } from "../../common/middleware/auth";

// ─── INVOICES ────────────────────────────────────────────────────────────────

export const getInvoices = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const orgId = req.params.orgId as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    // Verify user is member of org
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership && req.user.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }

    const where: any = { organizationId: orgId };
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { payments: true },
        skip,
        take: limit,
        orderBy: { issuedAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      success: true,
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const orgId = req.params.orgId as string;
    const invoiceId = req.params.invoiceId as string;

    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership && req.user.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice || invoice.organizationId !== orgId) {
      return next(new AppError("Invoice not found", 404));
    }

    res.json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const orgId = req.params.orgId as string;
    const { amount, description, dueAt } = req.body;

    if (amount === undefined || amount === null) {
      return next(new AppError("Amount is required", 400));
    }

    // Only org owner/admin or system admin can create invoices
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership && req.user.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }
    if (
      membership &&
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN" &&
      req.user.role !== "ADMIN"
    ) {
      return next(new AppError("Only org owners/admins can create invoices", 403));
    }

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: orgId,
        amount,
        status: "PENDING",
        issuedAt: new Date(),
        dueAt: dueAt ? new Date(dueAt) : null,
        description: description ?? null,
      },
    });

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  try {
    const orgId = req.params.orgId as string;
    const invoiceId = req.params.invoiceId as string;
    const { status } = req.body;

    if (req.user.role !== "ADMIN") {
      return next(new AppError("Only admins can update invoice status", 403));
    }

    const validStatuses = ["PENDING", "PAID", "OVERDUE", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Allowed: ${validStatuses.join(", ")}`, 400));
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.organizationId !== orgId) {
      return next(new AppError("Invoice not found", 404));
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
    });

    res.json({ success: true, invoice: updated });
  } catch (error) {
    next(error);
  }
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  const userId = req.user.id;
  try {
    const orgId = req.params.orgId as string;
    const invoiceId = req.params.invoiceId as string;

    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership && req.user.role !== "ADMIN") {
      return next(new AppError("Access denied", 403));
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.organizationId !== orgId) {
      return next(new AppError("Invoice not found", 404));
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  try {
    const orgId = req.params.orgId as string;
    const invoiceId = req.params.invoiceId as string;
    const { method, amount, reference } = req.body;

    if (req.user.role !== "ADMIN") {
      return next(new AppError("Only admins can record payments", 403));
    }

    if (!method || amount === undefined) {
      return next(new AppError("Method and amount are required", 400));
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.organizationId !== orgId) {
      return next(new AppError("Invoice not found", 404));
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        method,
        amount,
        status: "COMPLETED",
        reference: reference ?? null,
      },
    });

    // Mark invoice as paid if fully covered
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId, status: "COMPLETED" },
      _sum: { amount: true },
    });

    const paidAmount = totalPaid._sum?.amount ?? null;
    if (paidAmount !== null && paidAmount >= invoice.amount) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};
