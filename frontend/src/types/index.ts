export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  activePackage?: SubscriptionPackage | null;
  createdAt?: string;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  price?: number;
  maxFolders: number;
  maxNestingLevel: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  totalFileLimit: number;
  filesPerFolder: number;
  storageLimit?: number | string;
  isActive?: boolean;
  _count?: {
    activeUsers: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SubscriptionHistory {
  id: string;
  userId: string;
  packageId: string;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  subscriptionPackage?: SubscriptionPackage;
}

export type FileType = 'IMAGE' | 'VIDEO' | 'PDF' | 'AUDIO';

export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  nestingLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number | string;
  path: string;
  fileType: FileType;
  userId: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface TrashFolder extends Folder {
  deletedAt: string;
}

export interface TrashFileItem extends FileItem {
  deletedAt: string;
}

export interface TrashContents {
  files: TrashFileItem[];
  folders: TrashFolder[];
}

export type TrashItem = TrashFileItem | TrashFolder;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GrowthDataPoint {
  date: string;
  count: number;
}

export interface AdminUser extends User {
  isActive: boolean;
  storageUsed: number | string;
  lastLoginAt: string | null;
  activePackage?: SubscriptionPackage | null;
  _count: {
    files: number;
    folders: number;
  };
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  files: number;
  folders: number;
  packages: number;
  organizations: number;
  totalStorageUsed: number | string;
  subscriptionBreakdown: Array<{
    id: string;
    name: string;
    activeUsers: number;
  }>;
  fileTypeBreakdown: Array<{
    type: string;
    count: number;
    totalSize: number | string;
  }>;
  recentUsers: User[];
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  resource?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
}

export interface StorageProvider {
  id: string;
  name: string;
  type: string;
  bucket?: string | null;
  region?: string | null;
  endpoint?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    files: number;
  };
}

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  ownerId: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    members: number;
    folders: number;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: string;
  user?: User;
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  status: string;
  issuedAt: string;
  paidAt?: string | null;
  dueAt?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  method: string;
  amount: number;
  status: string;
  reference?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}
