import prisma from "../config/database";

/**
 * Recalculate and update storage used for a user.
 * Sums up all non-deleted files belonging to the user.
 */
export const syncUserStorageUsed = async (userId: string): Promise<bigint> => {
  const result = await prisma.file.aggregate({
    where: { userId, isDeleted: false },
    _sum: { size: true },
  });
  const total = BigInt(result._sum.size ?? 0);
  await prisma.user.update({ where: { id: userId }, data: { storageUsed: total } });
  return total;
};

/**
 * Increment storage used for a user by a given byte count.
 */
export const incrementStorageUsed = async (
  userId: string,
  bytes: number
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsed: { increment: BigInt(bytes) } },
  });
};

/**
 * Decrement storage used for a user by a given byte count.
 */
export const decrementStorageUsed = async (
  userId: string,
  bytes: number
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsed: { decrement: BigInt(bytes) } },
  });
};

/**
 * Check whether the user has enough storage quota for an upload.
 * Returns true if within limits (or no storage limit set on the package).
 */
export const checkStorageQuota = async (
  userId: string,
  incomingBytes: number
): Promise<{ allowed: boolean; used: bigint; limit: bigint }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      storageUsed: true,
      activePackage: { select: { storageLimit: true } },
    },
  });

  if (!user) return { allowed: false, used: BigInt(0), limit: BigInt(0) };

  const used = user.storageUsed;
  const limit = user.activePackage?.storageLimit ?? BigInt(0);

  // 0 means unlimited
  if (limit === BigInt(0)) return { allowed: true, used, limit };

  const allowed = used + BigInt(incomingBytes) <= limit;
  return { allowed, used, limit };
};

export const formatBytes = (bytes: bigint | number): string => {
  const n = Number(bytes);
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
