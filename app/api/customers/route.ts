import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Get customers error:", error);

    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
      const existingPhone = await prisma.customer.findFirst({
        where: {
          phone: phone.trim(),
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "A customer with this phone number already exists" },
          { status: 409 }
        );
      }

      if (email?.trim()) {
        const existingEmail = await prisma.customer.findFirst({
          where: {
            email: email.trim(),
          },
        });

        if (existingEmail) {
          return NextResponse.json(
            { error: "A customer with this email already exists" },
            { status: 409 }
          );
        }
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

    if (typeof phone !== "string" || !isValidPhone(phone)) {
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

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone.trim(),
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
  } catch (error) {
    console.error("Create customer error:", error);

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}