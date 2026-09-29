import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const movements = await prisma.stockMovement.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Get stock history error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view stock history",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 }
    );
  }
}

