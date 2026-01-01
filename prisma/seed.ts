import { PrismaClient, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main() {
  const tenantName = process.env.DEFAULT_TENANT_NAME || "Demo Organization";
  const tenantSlug = process.env.DEFAULT_TENANT_SLUG || "demo";
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "changeme123";
  const adminName = process.env.DEFAULT_ADMIN_NAME || "Admin User";

  // Check if tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
      },
    });
    console.log(`Created tenant: ${tenant.name} (${tenant.slug})`);
  } else {
    console.log(`Tenant already exists: ${tenant.name} (${tenant.slug})`);
  }

  // Check if admin user exists
  let user = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!user) {
    const passwordHash = await hashPassword(adminPassword);
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail,
        passwordHash,
        name: adminName,
        role: UserRole.OWNER,
      },
    });
    console.log(`Created admin user: ${user.email}`);
  } else {
    console.log(`Admin user already exists: ${user.email}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
