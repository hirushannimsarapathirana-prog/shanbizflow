import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await import("next/headers").then(
      (module) => module.cookies()
    );

    const token = (await cookieStore).get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 401,
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 500,
        }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);

    try {
      const { payload } = await jwtVerify(
        token,
        secret
      );

      const userId = Number(payload.userId);

      if (!userId) {
        throw new Error("Invalid user ID");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (jwtError) {
      console.error(
        "JWT verification failed:",
        jwtError
      );

      const response = NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        {
          status: 401,
        }
      );

      response.cookies.set({
        name: "auth_token",
        value: "",
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });

      return response;
    }
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 500,
      }
    );
  }
}