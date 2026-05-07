import bcrypt from "bcryptjs";
import prisma from "./config/database";

export async function seedDatabase() {
  console.log("Running database seeder...");

  // ─── 1. Subscription Packages ────────────────────────────────────────────────
  const packages = [
    {
      name: "Free",
      description: "Get started with basic file management features.",
      price: 0,
      maxFolders: 5,
      maxNestingLevel: 2,
      allowedFileTypes: ["IMAGE", "PDF"] as any,
      maxFileSize: 5,
      totalFileLimit: 20,
      filesPerFolder: 5,
      storageLimit: BigInt(500 * 1024 * 1024), // 500 MB
      isActive: true,
    },
    {
      name: "Silver",
      description: "Perfect for individuals and small teams.",
      price: 9.99,
      maxFolders: 15,
      maxNestingLevel: 3,
      allowedFileTypes: ["IMAGE", "PDF", "AUDIO"] as any,
      maxFileSize: 20,
      totalFileLimit: 100,
      filesPerFolder: 15,
      storageLimit: BigInt(5 * 1024 * 1024 * 1024), // 5 GB
      isActive: true,
    },
    {
      name: "Gold",
      description: "Advanced features for growing businesses.",
      price: 24.99,
      maxFolders: 50,
      maxNestingLevel: 5,
      allowedFileTypes: ["IMAGE", "VIDEO", "PDF", "AUDIO"] as any,
      maxFileSize: 100,
      totalFileLimit: 500,
      filesPerFolder: 50,
      storageLimit: BigInt(20 * 1024 * 1024 * 1024), // 20 GB
      isActive: true,
    },
    {
      name: "Diamond",
      description: "Unlimited power for enterprises.",
      price: 49.99,
      maxFolders: 200,
      maxNestingLevel: 10,
      allowedFileTypes: ["IMAGE", "VIDEO", "PDF", "AUDIO", "OTHER"] as any,
      maxFileSize: 500,
      totalFileLimit: 2000,
      filesPerFolder: 200,
      storageLimit: BigInt(100 * 1024 * 1024 * 1024), // 100 GB
      isActive: true,
    },
  ];

  for (const pkg of packages) {
    const existing = await prisma.subscriptionPackage.findUnique({ where: { name: pkg.name } });
    if (!existing) {
      await prisma.subscriptionPackage.create({ data: pkg });
      console.log(`  [package] "${pkg.name}" created.`);
    } else {
      console.log(`  [package] "${pkg.name}" already exists.`);
    }
  }

  const freePkg = await prisma.subscriptionPackage.findUnique({ where: { name: "Free" } });
  const silverPkg = await prisma.subscriptionPackage.findUnique({ where: { name: "Silver" } });

  // ─── 2. Storage Provider ─────────────────────────────────────────────────────
  const existingStorage = await prisma.storageProvider.findFirst({ where: { name: "Local Storage" } });
  if (!existingStorage) {
    await prisma.storageProvider.create({
      data: {
        name: "Local Storage",
        type: "local",
        isActive: true,
      },
    });
    console.log("  [storage] Local Storage provider created.");
  } else {
    console.log("  [storage] Local Storage provider already exists.");
  }

  // ─── 3. Users ────────────────────────────────────────────────────────────────
  const adminEmail = "admin@saasfilemanager.com";
  const user1Email = "user1@saasfilemanager.com";
  const user2Email = "user2@saasfilemanager.com";

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let user1 = await prisma.user.findUnique({ where: { email: user1Email } });
  let user2 = await prisma.user.findUnique({ where: { email: user2Email } });

  if (!admin) {
    const salt = await bcrypt.genSalt(12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash("Admin@123", salt),
        firstName: "System",
        lastName: "Admin",
        role: "ADMIN",
        isEmailVerified: true,
        activePackageId: freePkg?.id,
      },
    });
    console.log("  [user] admin@saasfilemanager.com created (Admin@123)");
  } else {
    console.log("  [user] admin already exists.");
  }

  if (!user1) {
    const salt = await bcrypt.genSalt(12);
    user1 = await prisma.user.create({
      data: {
        email: user1Email,
        password: await bcrypt.hash("User1@123", salt),
        firstName: "User",
        lastName: "One",
        role: "USER",
        isEmailVerified: true,
        activePackageId: freePkg?.id,
      },
    });
    console.log("  [user] user1@saasfilemanager.com created (User1@123)");
  } else {
    console.log("  [user] user1 already exists.");
  }

  if (!user2) {
    const salt = await bcrypt.genSalt(12);
    user2 = await prisma.user.create({
      data: {
        email: user2Email,
        password: await bcrypt.hash("User2@123", salt),
        firstName: "User",
        lastName: "Two",
        role: "USER",
        isEmailVerified: true,
        activePackageId: silverPkg?.id,
      },
    });
    console.log("  [user] user2@saasfilemanager.com created (User2@123)");
  } else {
    console.log("  [user] user2 already exists.");
  }

  // ─── 4. Subscription History ─────────────────────────────────────────────────
  if (freePkg && user1) {
    const existingHistory = await prisma.subscriptionHistory.findFirst({
      where: { userId: user1.id, packageId: freePkg.id },
    });
    if (!existingHistory) {
      await prisma.subscriptionHistory.create({
        data: { userId: user1.id, packageId: freePkg.id },
      });
      console.log("  [subscription history] user1 → Free created.");
    }
  }

  if (silverPkg && user2) {
    const existingHistory = await prisma.subscriptionHistory.findFirst({
      where: { userId: user2.id, packageId: silverPkg.id },
    });
    if (!existingHistory) {
      await prisma.subscriptionHistory.create({
        data: { userId: user2.id, packageId: silverPkg.id },
      });
      console.log("  [subscription history] user2 → Silver created.");
    }
  }

  // ─── 5. Organizations ────────────────────────────────────────────────────────
  if (user1) {
    const existingOrg1 = await prisma.organization.findUnique({ where: { slug: "user1-workspace" } });
    if (!existingOrg1) {
      const org1 = await prisma.organization.create({
        data: {
          name: "User One Workspace",
          slug: "user1-workspace",
          ownerId: user1.id,
          isActive: true,
        },
      });
      // Owner member record
      await prisma.organizationMember.create({
        data: { userId: user1.id, organizationId: org1.id, role: "OWNER" },
      });
      // Invite user2 as MEMBER
      if (user2) {
        await prisma.organizationMember.create({
          data: { userId: user2.id, organizationId: org1.id, role: "MEMBER" },
        });
      }
      console.log("  [org] User One Workspace created with members.");
    } else {
      console.log("  [org] User One Workspace already exists.");
    }
  }

  if (user2) {
    const existingOrg2 = await prisma.organization.findUnique({ where: { slug: "user2-workspace" } });
    if (!existingOrg2) {
      const org2 = await prisma.organization.create({
        data: {
          name: "User Two Workspace",
          slug: "user2-workspace",
          ownerId: user2.id,
          isActive: true,
        },
      });
      await prisma.organizationMember.create({
        data: { userId: user2.id, organizationId: org2.id, role: "OWNER" },
      });
      if (user1) {
        await prisma.organizationMember.create({
          data: { userId: user1.id, organizationId: org2.id, role: "VIEWER" },
        });
      }
      console.log("  [org] User Two Workspace created with members.");
    } else {
      console.log("  [org] User Two Workspace already exists.");
    }
  }

  // ─── 6. Folders ──────────────────────────────────────────────────────────────
  if (user1) {
    const existingFolder = await prisma.folder.findFirst({
      where: { userId: user1.id, name: "My Documents", parentId: null },
    });
    if (!existingFolder) {
      const rootFolder = await prisma.folder.create({
        data: {
          name: "My Documents",
          description: "Root documents folder",
          userId: user1.id,
          nestingLevel: 1,
          path: "/My Documents",
        },
      });
      await prisma.folder.create({
        data: {
          name: "Projects",
          description: "Work projects",
          userId: user1.id,
          parentId: rootFolder.id,
          nestingLevel: 2,
          path: "/My Documents/Projects",
        },
      });
      console.log("  [folder] user1 folders created.");
    } else {
      console.log("  [folder] user1 folders already exist.");
    }
  }

  if (user2) {
    const existingFolder = await prisma.folder.findFirst({
      where: { userId: user2.id, name: "My Files", parentId: null },
    });
    if (!existingFolder) {
      await prisma.folder.create({
        data: {
          name: "My Files",
          description: "Root files folder",
          userId: user2.id,
          nestingLevel: 1,
          path: "/My Files",
        },
      });
      console.log("  [folder] user2 folders created.");
    } else {
      console.log("  [folder] user2 folders already exist.");
    }
  }

  // ─── 7. Tags ─────────────────────────────────────────────────────────────────
  const tagDefs = [
    { name: "important", color: "#ef4444" },
    { name: "work", color: "#3b82f6" },
    { name: "personal", color: "#22c55e" },
  ];

  for (const tagDef of tagDefs) {
    if (user1) {
      const existing = await prisma.tag.findUnique({
        where: { name_userId: { name: tagDef.name, userId: user1.id } },
      });
      if (!existing) {
        await prisma.tag.create({ data: { ...tagDef, userId: user1.id } });
        console.log(`  [tag] "${tagDef.name}" created for user1.`);
      }
    }
    if (user2) {
      const existing = await prisma.tag.findUnique({
        where: { name_userId: { name: tagDef.name, userId: user2.id } },
      });
      if (!existing) {
        await prisma.tag.create({ data: { ...tagDef, userId: user2.id } });
        console.log(`  [tag] "${tagDef.name}" created for user2.`);
      }
    }
  }

  // ─── 8. Notifications ────────────────────────────────────────────────────────
  if (user1) {
    const existingNotif = await prisma.notification.findFirst({ where: { userId: user1.id } });
    if (!existingNotif) {
      await prisma.notification.createMany({
        data: [
          {
            userId: user1.id,
            title: "Welcome to File Forge!",
            message: "Your account is set up. Start by creating a folder or uploading a file.",
            type: "success",
            isRead: false,
          },
          {
            userId: user1.id,
            title: "Subscription Active",
            message: "You are on the Free plan. Upgrade anytime for more storage and features.",
            type: "info",
            isRead: false,
          },
        ],
      });
      console.log("  [notification] user1 notifications created.");
    }
  }

  if (user2) {
    const existingNotif = await prisma.notification.findFirst({ where: { userId: user2.id } });
    if (!existingNotif) {
      await prisma.notification.createMany({
        data: [
          {
            userId: user2.id,
            title: "Welcome to File Forge!",
            message: "Your account is set up. Start by creating a folder or uploading a file.",
            type: "success",
            isRead: false,
          },
          {
            userId: user2.id,
            title: "Silver Plan Active",
            message: "You are on the Silver plan. Enjoy 5 GB storage and more file types.",
            type: "info",
            isRead: false,
          },
        ],
      });
      console.log("  [notification] user2 notifications created.");
    }
  }

  // ─── 9. Audit Logs ───────────────────────────────────────────────────────────
  if (admin) {
    const existingLog = await prisma.auditLog.findFirst({ where: { userId: admin.id } });
    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "USER_LOGIN",
          resource: "auth",
          ipAddress: "127.0.0.1",
          userAgent: "seeder",
          metadata: { note: "Initial seed login record" },
        },
      });
      console.log("  [audit] admin audit log created.");
    }
  }

  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────────");
  console.log("  admin@saasfilemanager.com  /  Admin@123  (ADMIN)");
  console.log("  user1@saasfilemanager.com  /  User1@123  (Free plan)");
  console.log("  user2@saasfilemanager.com  /  User2@123  (Silver plan)");
  console.log("─────────────────────────────────────");
}

// Run directly: npm run prisma:seed
if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
