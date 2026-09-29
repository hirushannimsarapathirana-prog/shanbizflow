import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();

  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const secret = new TextEncoder().encode(jwtSecret);

  const { payload } = await jwtVerify(
    token,
    secret
  );

  const userId = Number(payload.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

export async function GET() {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return NextResponse.json(
      {
        error: "Invalid or expired session",
      },
      {
        status: 401,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Not authenticated",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          error:
            "Name must be at least 2 characters",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          error:
            "Name cannot exceed 100 characters",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
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
      message:
        "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update profile",
      },
      {
        status: 500,
      }
    );
  }
}