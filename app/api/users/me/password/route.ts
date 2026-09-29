import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";

    const newPassword =
      typeof body.newPassword === "string"
        ? body.newPassword
        : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error:
            "Current password and new password are required",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          error: "New password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    if (newPassword.length > 100) {
      return NextResponse.json(
        {
          error: "New password must not exceed 100 characters",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error:
            "New password must be different from current password",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      existingUser.password
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: "Current password is incorrect",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to change password",
      },
      { status: 500 }
    );
  }
}