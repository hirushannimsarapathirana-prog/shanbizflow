import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/client";

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
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

    const { payload } = await jwtVerify(token, secret);

    const userId = Number(payload.userId);
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = payload.role as UserRole;

    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    if (!email) {
      return null;
    }

    if (!Object.values(UserRole).includes(role)) {
      return null;
    }

    return {
      id: userId,
      email,
      role,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export function hasRole(
  user: AuthUser,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(user.role);
}