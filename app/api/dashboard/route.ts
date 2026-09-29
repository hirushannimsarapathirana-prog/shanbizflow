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

    const [
      productsCount,
      customersCount,
      completedSales,
      recentSales,
      lowStockProducts,
    ] = await Promise.all([
      prisma.product.count(),

      prisma.customer.count(),

      prisma.sale.findMany({
        where: {
          saleStatus: "COMPLETED",
        },
        select: {
          id: true,
          total: true,
          paidAmount: true,
        },
      }),

      prisma.sale.findMany({
        where: {
          saleStatus: "COMPLETED",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }),

      prisma.product.findMany({
        where: {
          stock: {
            lte: 5,
          },
        },
        orderBy: {
          stock: "asc",
        },
        take: 5,
      }),
    ]);

    const totalRevenue = completedSales.reduce(
      (total, sale) => total + sale.total,
      0
    );

    const totalPaid = completedSales.reduce(
      (total, sale) => total + sale.paidAmount,
      0
    );

    const totalOutstanding = completedSales.reduce(
      (total, sale) =>
        total + Math.max(sale.total - sale.paidAmount, 0),
      0
    );

    const recentSalesData = recentSales.map((sale) => ({
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
      itemCount: sale.items.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      createdAt: sale.createdAt,
      paymentStatus: sale.paymentStatus,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders: completedSales.length,
        totalCustomers: customersCount,
        totalProducts: productsCount,
        totalPaid,
        totalOutstanding,
      },

      recentSales: recentSalesData,

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "Dashboard data error:",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view the dashboard",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load dashboard data",
      },
      {
        status: 500,
      }
    );
  }
}

