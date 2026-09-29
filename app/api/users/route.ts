import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireRole([UserRole.SUPER_ADMIN]);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      users,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    console.error("Get users error:", error);

    return NextResponse.json(
      {
        error: "Failed to load users",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([UserRole.SUPER_ADMIN]);

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const role =
      typeof body.role === "string"
        ? body.role
        : "";

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          error:
            "Name, email, password and role are required",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          error: "Name must be at least 2 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error: "Name cannot exceed 100 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        {
          error: "Invalid role",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email already exists",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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

    return NextResponse.json(
      {
        message: "User created successfully",
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    console.error("Create user error:", error);

    return NextResponse.json(
      {
        error: "Failed to create user",
      },
      {
        status: 500,
      }
    );
  }
}

