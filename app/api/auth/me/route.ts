import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("auth_token")?.value;

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

    const secret = new TextEncoder().encode(
      jwtSecret
    );

    try {
      const { payload } =
        await jwtVerify(
          token,
          secret
        );

      const userId = Number(
        payload.userId
      );

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        throw new Error(
          "Invalid user ID"
        );
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

      if (!user) {
        throw new Error(
          "User not found"
        );
      }

      return NextResponse.json({
        authenticated: true,
        user,
        expiresAt: payload.exp
          ? payload.exp * 1000
          : null,
      });
    } catch (jwtError) {
      console.error(
        "JWT verification failed:",
        jwtError
      );

      const response =
        NextResponse.json(
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
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        maxAge: 0,
        expires: new Date(0),
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