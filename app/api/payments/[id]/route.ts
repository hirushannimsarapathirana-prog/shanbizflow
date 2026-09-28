import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const { id } = await context.params;

    const paymentId = Number(id);

    if (!Number.isInteger(paymentId)) {
      return NextResponse.json(
        {
          error: "Invalid payment ID",
        },
        {
          status: 400,
        }
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
        {
          error: "Payment not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payment",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const paymentId = Number(id);

    if (!Number.isInteger(paymentId)) {
      return NextResponse.json(
        {
          error: "Invalid payment ID",
        },
        {
          status: 400,
        }
      );
    }

    const payment = await prisma.salePayment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          error: "Payment not found",
        },
        {
          status: 404,
        }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.salePayment.delete({
          where: {
            id: paymentId,
          },
        });

        const remainingPayments =
          await tx.salePayment.findMany({
            where: {
              saleId: payment.saleId,
            },
          });

        const newPaidAmount =
          remainingPayments.reduce(
            (total, item) => total + item.amount,
            0
          );

        const sale = await tx.sale.findUnique({
          where: {
            id: payment.saleId,
          },
        });

        if (!sale) {
          throw new Error("Sale not found");
        }

        let paymentStatus = "CREDIT";

        if (newPaidAmount >= sale.total) {
          paymentStatus = "PAID";
        } else if (newPaidAmount > 0) {
          paymentStatus = "PARTIAL";
        }

        const updatedSale = await tx.sale.update({
          where: {
            id: payment.saleId,
          },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus,
          },
        });

        return updatedSale;
      }
    );

    return NextResponse.json({
      message: "Payment deleted successfully",
      sale: result,
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete payment",
      },
      {
        status: 500,
      }
    );
  }
}