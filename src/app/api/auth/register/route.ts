import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, registerSchema, createSession } from "@/lib/auth";
import { UserRole, PlanCode } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { tenantName, tenantSlug, email, password, name } = result.data;

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Tenant slug already taken" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create tenant, user, plan assignment, and usage in a transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      // Get FREE plan
      const freePlan = await tx.plan.findUnique({
        where: { code: PlanCode.FREE },
      });

      if (!freePlan) {
        throw new Error("FREE plan not found. Run seed first.");
      }

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          name,
          role: UserRole.OWNER,
        },
      });

      // Assign FREE plan to tenant
      await tx.tenantPlan.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          isActive: true,
        },
      });

      // Initialize tenant usage
      await tx.tenantUsage.create({
        data: {
          tenantId: tenant.id,
          videosCreatedLifetime: 0,
        },
      });

      return { tenant, user };
    });

    // Create session
    await createSession(user.id, tenant.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
