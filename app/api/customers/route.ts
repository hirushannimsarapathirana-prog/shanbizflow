import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "You do not have permission to view customers" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const body = await request.json();

    const {
      name,
      email,
      phone,
      address,
      imageUrl,
    } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    if (typeof phone !== "string" || !isValidPhone(phone.trim())) {
      return NextResponse.json(
        { error: "Phone number must contain exactly 10 digits" },
        { status: 400 }
      );
    }

    if (email !== undefined && email !== null && email !== "") {
      if (
        typeof email !== "string" ||
        !isValidEmail(email.trim())
      ) {
        return NextResponse.json(
          { error: "Please enter a valid email address" },
          { status: 400 }
        );
      }
    }

    if (
      email !== undefined &&
      email !== null &&
      typeof email !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (
      address !== undefined &&
      address !== null &&
      typeof address !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid address" },
        { status: 400 }
      );
    }

    if (
      imageUrl !== undefined &&
      imageUrl !== null &&
      typeof imageUrl !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid image URL" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.trim();
    const normalizedEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : null;

    const existingPhone = await prisma.customer.findFirst({
      where: {
        phone: normalizedPhone,
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          error: "A customer with this phone number already exists",
        },
        { status: 409 }
      );
    }

    if (normalizedEmail) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            error: "A customer with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        address: address?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      },
    });

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create customer error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error: "You do not have permission to create customers",
        },
        { status: 403 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Phone number or email already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}