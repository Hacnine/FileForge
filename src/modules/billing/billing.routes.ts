import { Router } from "express";
import { authenticate } from "../../common/middleware/auth";
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  getPayments,
  createPayment,
} from "./billing.controller";

// Mounted at /api/organizations/:orgId/billing
const router = Router({ mergeParams: true });

router.use(authenticate);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get("/invoices", getInvoices);
router.get("/invoices/:invoiceId", getInvoiceById);
router.post("/invoices", createInvoice);
router.patch("/invoices/:invoiceId/status", updateInvoiceStatus);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get("/invoices/:invoiceId/payments", getPayments);
router.post("/invoices/:invoiceId/payments", createPayment);

export default router;
