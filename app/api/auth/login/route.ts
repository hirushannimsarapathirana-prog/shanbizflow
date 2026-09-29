import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const SESSION_DURATION_SECONDS = 30 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username) {
      return NextResponse.json(
        {
          error: "Username is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: "Password is required",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        {
          status: 401,
        }
      );
    }

    const passwordValid = password === user.password;

    if (!passwordValid) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        {
          status: 401,
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return NextResponse.json(
        {
          error: "Authentication configuration error",
        },
        {
          status: 500,
        }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secret);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        error: "Unable to login",
      },
      {
        status: 500,
      }
    );
  }
}