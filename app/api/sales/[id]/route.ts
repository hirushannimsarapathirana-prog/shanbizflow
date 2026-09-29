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
        { error: "You do not have permission to view this sale" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch sale" },
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
    const action = body?.action;

    if (action !== "CANCEL") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },
      include: {
        items: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    if (sale.saleStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Sale is already cancelled" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: {
          id: saleId,
        },
        data: {
          saleStatus: "CANCELLED",
        },
      });

      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: {
            id: item.productId,
          },
        });

        if (!product) {
          throw new Error(
            `Product ${item.productId} not found`
          );
        }

        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "STOCK_IN",
            quantity: item.quantity,
            reference: `SALE-CANCEL-${sale.invoiceNumber}`,
          },
        });
      }
    });

    const updatedSale = await prisma.sale.findUnique({
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

    return NextResponse.json({
      message: "Sale cancelled successfully",
      sale: updatedSale,
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