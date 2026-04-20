import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255).trim(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid("Invalid parent folder ID").optional(),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255).trim(),
});

export const moveFolderSchema = z.object({
  newParentId: z.string().uuid("Invalid folder ID").nullable().optional(),
});

export const renameFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255).trim(),
});

export const moveFileSchema = z.object({
  folderId: z.string().uuid("Invalid folder ID"),
});

export const createPackageSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  maxFolders: z.number().int().min(1),
  maxNestingLevel: z.number().int().min(1).max(20),
  allowedFileTypes: z
    .array(z.enum(["IMAGE", "VIDEO", "PDF", "AUDIO", "OTHER"]))
    .min(1),
  maxFileSize: z.number().int().min(1),
  totalFileLimit: z.number().int().min(1),
  filesPerFolder: z.number().int().min(1),
  storageLimit: z.number().int().min(0).optional(),
});

export const shareLinkSchema = z.object({
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(1).max(1000).optional(),
  password: z.string().min(4).max(64).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
});

export const subscribeSchema = z.object({
  packageId: z.string().uuid("Invalid package ID"),
});
