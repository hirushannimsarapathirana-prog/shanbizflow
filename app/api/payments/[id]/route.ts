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

    const paymentId = Number(id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await prisma.salePayment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);

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
            "You do not have permission to view this payment",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch payment",
      },
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

    const paymentId = Number(id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await prisma.salePayment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        sale: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const currentPayment =
          await tx.salePayment.findUnique({
            where: {
              id: paymentId,
            },
          });

        if (!currentPayment) {
          throw new Error("PAYMENT_NOT_FOUND");
        }

        const sale = await tx.sale.findUnique({
          where: {
            id: currentPayment.saleId,
          },
          include: {
            payments: true,
          },
        });

        if (!sale) {
          throw new Error("SALE_NOT_FOUND");
        }

        await tx.salePayment.delete({
          where: {
            id: paymentId,
          },
        });

        const remainingPayments =
          await tx.salePayment.findMany({
            where: {
              saleId: currentPayment.saleId,
            },
          });

        const totalPaid = remainingPayments.reduce(
          (total, item) => {
            return total + Number(item.amount);
          },
          0
        );

        const saleTotal = Number(sale.total);

        let paymentStatus:
          | "PAID"
          | "PARTIAL"
          | "CREDIT";

        if (totalPaid >= saleTotal) {
          paymentStatus = "PAID";
        } else if (totalPaid > 0) {
          paymentStatus = "PARTIAL";
        } else {
          paymentStatus = "CREDIT";
        }

        const updatedSale =
          await tx.sale.update({
            where: {
              id: currentPayment.saleId,
            },
            data: {
              paidAmount: totalPaid,
              paymentStatus,
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

        return {
          updatedSale,
          totalPaid,
          paymentStatus,
        };
      },
      {
        maxWait: 20000,
        timeout: 30000,
      }
    );

    return NextResponse.json({
      message: "Payment deleted successfully",
      paymentId,
      saleId: payment.saleId,
      paidAmount: result.totalPaid,
      paymentStatus: result.paymentStatus,
      sale: result.updatedSale,
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
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
            "You do not have permission to delete payments",
        },
        { status: 403 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PAYMENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Payment not found",
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "SALE_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Sale not found",
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "Transaction API error"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Database is busy. Please try again in a moment.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete payment",
      },
      { status: 500 }
    );
  }
}

