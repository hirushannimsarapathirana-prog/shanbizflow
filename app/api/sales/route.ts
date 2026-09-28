import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SaleItemInput = {
  productId: number;
  quantity: number;
};

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Get sales error:", error);

    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerId,
      items,
      discount = 0,
      paidAmount = 0,
      paymentMethod,
      paymentNote,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "At least one product is required",
        },
        { status: 400 }
      );
    }

    const cleanDiscount = Number(discount);
    const cleanPaidAmount = Number(paidAmount);

    if (
      !Number.isFinite(cleanDiscount) ||
      cleanDiscount < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid discount amount",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(cleanPaidAmount) ||
      cleanPaidAmount < 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid paid amount",
        },
        { status: 400 }
      );
    }

    let cleanCustomerId: number | null = null;

    if (
      customerId !== null &&
      customerId !== undefined &&
      customerId !== ""
    ) {
      cleanCustomerId = Number(customerId);

      if (!Number.isInteger(cleanCustomerId)) {
        return NextResponse.json(
          {
            error: "Invalid customer ID",
          },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.findUnique({
        where: {
          id: cleanCustomerId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          {
            error: "Customer not found",
          },
          { status: 404 }
        );
      }
    }

    const cleanItems: SaleItemInput[] = items.map(
      (item: SaleItemInput) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      })
    );

    for (const item of cleanItems) {
      if (
        !Number.isInteger(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Each product must have a valid product ID and quantity",
          },
          { status: 400 }
        );
      }
    }

    const productIds = cleanItems.map(
      (item) => item.productId
    );

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return NextResponse.json(
        {
          error:
            "The same product cannot be added more than once",
        },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error: "One or more products were not found",
        },
        { status: 404 }
      );
    }

    let subtotal = 0;

    const saleItems = cleanItems.map((item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Not enough stock for ${product.name}. Available stock: ${product.stock}`
        );
      }

      const itemSubtotal =
        Number(product.price) * item.quantity;

      subtotal += itemSubtotal;

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
      };
    });

    if (cleanDiscount > subtotal) {
      return NextResponse.json(
        {
          error:
            "Discount cannot be greater than subtotal",
        },
        { status: 400 }
      );
    }

    const total = subtotal - cleanDiscount;

    if (cleanPaidAmount > total) {
      return NextResponse.json(
        {
          error:
            "Paid amount cannot be greater than total",
        },
        { status: 400 }
      );
    }

    let paymentStatus = "CREDIT";

    if (cleanPaidAmount === total) {
      paymentStatus = "PAID";
    } else if (cleanPaidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    if (
      cleanPaidAmount > 0 &&
      (!paymentMethod ||
        String(paymentMethod).trim() === "")
    ) {
      return NextResponse.json(
        {
          error:
            "Payment method is required when a payment is made",
        },
        { status: 400 }
      );
    }

    const invoiceNumber = `INV-${Date.now()}`;

    /*
     * Keep the transaction as short as possible.
     *
     * Do NOT include customer/product relations here.
     * Those are loaded after the transaction finishes.
     */
    const createdSale = await prisma.$transaction(
      async (transaction) => {
        const sale = await transaction.sale.create({
          data: {
            invoiceNumber,

            customerId: cleanCustomerId,

            subtotal,

            discount: cleanDiscount,

            total,

            paidAmount: cleanPaidAmount,

            paymentStatus,

            saleStatus: "COMPLETED",

            items: {
              create: saleItems,
            },

            payments:
              cleanPaidAmount > 0
                ? {
                    create: {
                      amount: cleanPaidAmount,
                      paymentMethod:
                        String(paymentMethod),
                      note:
                        paymentNote &&
                        String(paymentNote).trim()
                          ? String(paymentNote).trim()
                          : null,
                    },
                  }
                : undefined,
          },

          select: {
            id: true,
          },
        });

        for (const item of cleanItems) {
          const updatedProduct =
            await transaction.product.updateMany({
              where: {
                id: item.productId,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

          if (updatedProduct.count === 0) {
            throw new Error(
              `Not enough stock for product ID ${item.productId}`
            );
          }
        }

        return sale;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    /*
     * Load the complete sale AFTER the transaction.
     * This keeps the transaction much faster.
     */
    const sale = await prisma.sale.findUnique({
      where: {
        id: createdSale.id,
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

    return NextResponse.json(
      {
        message: "Sale created successfully",
        sale,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create sale error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create sale",
      },
      { status: 500 }
    );
  }
}