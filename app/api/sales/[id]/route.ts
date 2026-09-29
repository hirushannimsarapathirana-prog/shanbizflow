import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    const saleId = Number(id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json(
        { error: "Invalid sale ID" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Get sale error:", error);

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
            "You do not have permission to view this sale",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch sale",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    await requireRole([
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
    ]);

    const { id } = await context.params;
    const saleId = Number(id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json(
        { error: "Invalid sale ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const action =
      typeof body.action === "string"
        ? body.action.trim().toUpperCase()
        : "";

    if (action !== "CANCEL") {
      return NextResponse.json(
        { error: "Invalid sale action" },
        { status: 400 }
      );
    }

    const cancelledSale = await prisma.$transaction(
      async (transaction) => {
        const sale =
          await transaction.sale.findUnique({
            where: {
              id: saleId,
            },
            include: {
              items: true,
            },
          });

        if (!sale) {
          throw new Error("SALE_NOT_FOUND");
        }

        if (sale.saleStatus === "CANCELLED") {
          throw new Error("SALE_ALREADY_CANCELLED");
        }

        if (sale.saleStatus !== "COMPLETED") {
          throw new Error("SALE_CANNOT_BE_CANCELLED");
        }

        for (const item of sale.items) {
          const product =
            await transaction.product.findUnique({
              where: {
                id: item.productId,
              },
            });

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          const previousStock = product.stock;
          const newStock =
            previousStock + item.quantity;

          await transaction.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: newStock,
            },
          });

          await transaction.stockMovement.create({
            data: {
              productId: item.productId,
              type: "STOCK_IN",
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: `Sale cancelled - ${sale.invoiceNumber}`,
            },
          });
        }

        const updatedSale =
          await transaction.sale.update({
            where: {
              id: saleId,
            },
            data: {
              saleStatus: "CANCELLED",
            },
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                },
              },
              payments: true,
            },
          });

        return updatedSale;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json({
      message: "Sale cancelled successfully",
      sale: cancelledSale,
    });
  } catch (error) {
    console.error("Cancel sale error:", error);

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
            "You do not have permission to cancel sales",
        },
        { status: 403 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SALE_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SALE_ALREADY_CANCELLED"
    ) {
      return NextResponse.json(
        {
          error:
            "This sale has already been cancelled",
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SALE_CANNOT_BE_CANCELLED"
    ) {
      return NextResponse.json(
        {
          error:
            "This sale cannot be cancelled",
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PRODUCT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Product not found while restoring stock",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel sale",
      },
      { status: 500 }
    );
  }
}