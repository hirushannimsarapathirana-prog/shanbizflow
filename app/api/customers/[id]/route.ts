import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const { id } = await context.params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Get customer error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error: "You do not have permission to view customers",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const { id } = await context.params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

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

    if (
      typeof phone !== "string" ||
      !isValidPhone(phone.trim())
    ) {
      return NextResponse.json(
        {
          error: "Phone number must contain exactly 10 digits",
        },
        { status: 400 }
      );
    }

    if (email !== undefined && email !== null && email !== "") {
      if (
        typeof email !== "string" ||
        !isValidEmail(email.trim())
      ) {
        return NextResponse.json(
          {
            error: "Please enter a valid email address",
          },
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

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
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
        NOT: {
          id: customerId,
        },
      },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          error:
            "A customer with this phone number already exists",
        },
        { status: 409 }
      );
    }

    if (normalizedEmail) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          email: normalizedEmail,
          NOT: {
            id: customerId,
          },
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            error:
              "A customer with this email already exists",
          },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        address: address?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      },
    });

    return NextResponse.json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error: unknown) {
    console.error("Update customer error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error: "You do not have permission to update customers",
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
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ]);

    const { id } = await context.params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete customers",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
