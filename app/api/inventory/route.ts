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
        name: "asc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Get inventory error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view inventory",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch inventory" },
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

    const {
      productId,
      type,
      quantity,
      reason,
    } = body;

    const id = Number(productId);
    const qty = Number(quantity);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "STOCK_IN",
      "STOCK_OUT",
      "ADJUSTMENT",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid inventory movement type" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    let newStock = product.stock;

    if (type === "STOCK_IN") {
      newStock = product.stock + qty;
    }

    if (type === "STOCK_OUT") {
      if (qty > product.stock) {
        return NextResponse.json(
          {
            error: `Insufficient stock. Available stock: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      newStock = product.stock - qty;
    }

    if (type === "ADJUSTMENT") {
      newStock = qty;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: {
          id,
        },
        data: {
          stock: newStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          type,
          quantity:
            type === "ADJUSTMENT"
              ? Math.abs(newStock - product.stock)
              : qty,
          previousStock: product.stock,
          newStock,
          reason: reason?.trim() || null,
        },
      });

      return {
        updatedProduct,
        movement,
      };
    });

    return NextResponse.json(
      {
        message: "Inventory updated successfully",
        product: result.updatedProduct,
        movement: result.movement,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Inventory update error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to update inventory",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}

