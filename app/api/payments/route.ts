import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const payments = await prisma.salePayment.findMany({
      orderBy: {
        paymentDate: "desc",
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch payments",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      saleId,
      amount,
      paymentMethod,
      note,
    } = body;

    const parsedSaleId = Number(saleId);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedSaleId)) {
      return NextResponse.json(
        {
          error: "Valid sale ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        {
          error: "Payment amount must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    if (!paymentMethod || typeof paymentMethod !== "string") {
      return NextResponse.json(
        {
          error: "Payment method is required",
        },
        {
          status: 400,
        }
      );
    }

    const sale = await prisma.sale.findUnique({
      where: {
        id: parsedSaleId,
      },
      include: {
        payments: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        {
          error: "Sale not found",
        },
        {
          status: 404,
        }
      );
    }

    if (sale.saleStatus === "CANCELLED") {
      return NextResponse.json(
        {
          error: "Cannot add payment to a cancelled sale",
        },
        {
          status: 400,
        }
      );
    }

    const currentPaidAmount = sale.payments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    const remainingAmount =
      sale.total - currentPaidAmount;

    if (remainingAmount <= 0) {
      return NextResponse.json(
        {
          error: "This sale is already fully paid",
        },
        {
          status: 400,
        }
      );
    }

    if (parsedAmount > remainingAmount) {
      return NextResponse.json(
        {
          error: `Payment cannot exceed remaining balance of ${remainingAmount.toFixed(
            2
          )}`,
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const payment = await tx.salePayment.create({
          data: {
            saleId: parsedSaleId,
            amount: parsedAmount,
            paymentMethod: paymentMethod.trim(),
            note:
              typeof note === "string" && note.trim()
                ? note.trim()
                : null,
          },
        });

        const newPaidAmount =
          currentPaidAmount + parsedAmount;

        let paymentStatus = "PARTIAL";

        if (newPaidAmount >= sale.total) {
          paymentStatus = "PAID";
        }

        const updatedSale = await tx.sale.update({
          where: {
            id: parsedSaleId,
          },
          data: {
            paidAmount: newPaidAmount,
            paymentStatus,
          },
        });

        return {
          payment,
          sale: updatedSale,
        };
      }
    );

    return NextResponse.json(
      {
        message: "Payment added successfully",
        payment: result.payment,
        sale: result.sale,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create payment error:", error);

    return NextResponse.json(
      {
        error: "Failed to create payment",
      },
      {
        status: 500,
      }
    );
  }
}