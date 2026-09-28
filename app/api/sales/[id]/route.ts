import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const saleId = Number(id);

    if (!Number.isInteger(saleId)) {
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

    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}