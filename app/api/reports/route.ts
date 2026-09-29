import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getDateRange(range: string, start?: string, end?: string) {
  const now = new Date();

  if (range === "today") {
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    return { startDate, endDate };
  }

  if (range === "year") {
    const startDate = new Date(
      now.getFullYear(),
      0,
      1
    );

    const endDate = new Date(
      now.getFullYear() + 1,
      0,
      1
    );

    return { startDate, endDate };
  }

  if (range === "custom" && start && end) {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T23:59:59.999`);

    return { startDate, endDate };
  }

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  return { startDate, endDate };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const range = searchParams.get("range") || "month";
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;

    const { startDate, endDate } = getDateRange(
      range,
      start,
      end
    );

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const completedSales = sales.filter(
      (sale) => sale.saleStatus !== "CANCELLED"
    );

    const totalRevenue = completedSales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    const totalPayments = completedSales.reduce(
      (total, sale) => total + sale.paidAmount,
      0
    );

    const outstanding = completedSales.reduce(
      (total, sale) =>
        total + Math.max(sale.total - sale.paidAmount, 0),
      0
    );

    const totalItemsSold = completedSales.reduce(
      (total, sale) =>
        total +
        sale.items.reduce(
          (itemTotal, item) => itemTotal + item.quantity,
          0
        ),
      0
    );

    const paymentSummary = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CHEQUE: 0,
      OTHER: 0,
    };

    completedSales.forEach((sale) => {
      sale.payments.forEach((payment) => {
        const method = payment.paymentMethod
          .trim()
          .toUpperCase()
          .replace(/ /g, "_");

        if (method in paymentSummary) {
          paymentSummary[
            method as keyof typeof paymentSummary
          ] += payment.amount;
        } else {
          paymentSummary.OTHER += payment.amount;
        }
      });
    });

    const salesByDayMap: Record<
      string,
      {
        date: string;
        revenue: number;
        sales: number;
      }
    > = {};

    completedSales.forEach((sale) => {
      const date = new Date(sale.createdAt);

      const key = date.toISOString().split("T")[0];

      if (!salesByDayMap[key]) {
        salesByDayMap[key] = {
          date: key,
          revenue: 0,
          sales: 0,
        };
      }

      salesByDayMap[key].revenue += sale.total;
      salesByDayMap[key].sales += 1;
    });

    const salesByDay = Object.values(
      salesByDayMap
    ).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const recentSales = completedSales
      .slice(0, 10)
      .map((sale) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        customerName:
          sale.customer?.name || "Walk-in Customer",
        total: sale.total,
        paidAmount: sale.paidAmount,
        balance: Math.max(
          sale.total - sale.paidAmount,
          0
        ),
        paymentStatus: sale.paymentStatus,
        createdAt: sale.createdAt,
      }));

    return NextResponse.json({
      range,
      startDate,
      endDate,

      summary: {
        totalRevenue,
        totalSales: completedSales.length,
        totalPayments,
        outstanding,
        totalItemsSold,
      },

      paymentSummary,

      salesByDay,

      recentSales,
    });
  } catch (error) {
    console.error("Reports error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate reports",
      },
      {
        status: 500,
      }
    );
  }
}