import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.STAFF,
    ]);

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Unable to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ]);

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const price = Number(body.price);
    const stock = Number(body.stock);

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : null;

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid positive number" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a valid non-negative integer" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price,
        stock,
        category: category || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "You do not have permission to add products" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create product" },
      { status: 500 }
    );
  }
}