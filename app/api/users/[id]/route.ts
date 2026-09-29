import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireRole([UserRole.SUPER_ADMIN]);

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    console.error("Get user error:", error);

    return NextResponse.json(
      { error: "Unable to get user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const currentUser = await requireRole([
      UserRole.SUPER_ADMIN,
    ]);

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const role =
      typeof body.role === "string"
        ? body.role
        : "";

    if (!name || !email || !role) {
      return NextResponse.json(
        {
          error: "Name, email and role are required",
        },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        {
          error: "Name must be between 2 and 100 characters",
        },
        { status: 400 }
      );
    }

    if (
      !Object.values(UserRole).includes(
        role as UserRole
      )
    ) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: { id: userId },
      });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const emailUser =
      await prisma.user.findUnique({
        where: { email },
      });

    if (
      emailUser &&
      emailUser.id !== userId
    ) {
      return NextResponse.json(
        {
          error: "Email is already in use",
        },
        { status: 409 }
      );
    }

    if (
      currentUser.id === userId &&
      role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot remove your own SUPER_ADMIN role",
        },
        { status: 400 }
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          role: role as UserRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    console.error("Update user error:", error);

    return NextResponse.json(
      { error: "Unable to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const currentUser = await requireRole([
      UserRole.SUPER_ADMIN,
    ]);

    const { id } = await context.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (currentUser.id === userId) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own account",
        },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: { id: userId },
      });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    console.error("Delete user error:", error);

    return NextResponse.json(
      { error: "Unable to delete user" },
      { status: 500 }
    );
  }
}