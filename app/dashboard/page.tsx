import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "@/components/DashboardSidebar";

type DashboardData = {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    customerName: string;
    total: number;
    paidAmount: number;
    balance: number;
    itemCount: number;
    createdAt: string;
    paymentStatus: string;
  }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
    price: number;
  }>;
};

async function getDashboardData(): Promise<DashboardData> {
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
    (total, sale) => total + Number(sale.total),
    0
  );

  const totalPaid = completedSales.reduce(
    (total, sale) => total + Number(sale.paidAmount),
    0
  );

  const totalOutstanding = completedSales.reduce(
    (total, sale) =>
      total +
      Math.max(
        Number(sale.total) - Number(sale.paidAmount),
        0
      ),
    0
  );

  const recentSalesData = recentSales.map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerName:
      sale.customer?.name || "Walk-in Customer",
    total: Number(sale.total),
    paidAmount: Number(sale.paidAmount),
    balance: Math.max(
      Number(sale.total) - Number(sale.paidAmount),
      0
    ),
    itemCount: sale.items.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    createdAt: sale.createdAt.toISOString(),
    paymentStatus: sale.paymentStatus,
  }));

  return {
    summary: {
      totalRevenue,
      totalOrders: completedSales.length,
      totalCustomers: customersCount,
      totalProducts: productsCount,
      totalPaid,
      totalOutstanding,
    },
    recentSales: recentSalesData,
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: Number(product.price),
    })),
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let data: DashboardData;

  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Dashboard loading error:", error);

    throw new Error(
      "Unable to load dashboard data. Please try again."
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-h-screen min-w-0 lg:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

          {/* Header */}
          <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
                Business Overview
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                Welcome back. Here is your business overview.
              </p>
            </div>

            <div className="inline-flex w-fit max-w-full shrink-0 items-center rounded-full border border-sky-100 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm sm:px-4 sm:text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">

            <div className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>

              <h2 className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                Rs.{" "}
                {data.summary.totalRevenue.toLocaleString(
                  "en-LK",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </h2>
            </div>

            <div className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Orders
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {data.summary.totalOrders.toLocaleString()}
              </h2>
            </div>

            <div className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Customers
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {data.summary.totalCustomers.toLocaleString()}
              </h2>
            </div>

            <div className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Products
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                {data.summary.totalProducts.toLocaleString()}
              </h2>
            </div>

          </div>

          {/* Financial + Low Stock */}
          <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-2">

            {/* Financial Overview */}
            <section className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                Financial Overview
              </h2>

              <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0 text-sm text-slate-500 sm:text-base dark:text-slate-400">
                    Total Revenue
                  </span>

                  <span className="shrink-0 text-right text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                    Rs.{" "}
                    {data.summary.totalRevenue.toLocaleString(
                      "en-LK",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0 text-sm text-slate-500 sm:text-base dark:text-slate-400">
                    Total Paid
                  </span>

                  <span className="shrink-0 text-right text-sm font-semibold text-emerald-600 sm:text-base dark:text-emerald-400">
                    Rs.{" "}
                    {data.summary.totalPaid.toLocaleString(
                      "en-LK",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="min-w-0 text-sm text-slate-500 sm:text-base dark:text-slate-400">
                    Outstanding
                  </span>

                  <span className="shrink-0 text-right text-sm font-semibold text-amber-600 sm:text-base dark:text-amber-400">
                    Rs.{" "}
                    {data.summary.totalOutstanding.toLocaleString(
                      "en-LK",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

              </div>
            </section>

            {/* Low Stock Products */}
            <section className="min-w-0 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                  Low Stock Products
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Products that need attention
                </p>
              </div>

              <div className="mt-4 space-y-3 sm:mt-5">

                {data.lowStockProducts.length === 0 ? (
                  <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    No low-stock products.
                  </div>
                ) : (
                  data.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 sm:text-base dark:text-white">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Product #{product.id}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:px-3 dark:bg-red-950/30 dark:text-red-400">
                        {product.stock} left
                      </span>
                    </div>
                  ))
                )}

              </div>
            </section>

          </div>

          {/* Recent Sales */}
          <section className="mt-6 min-w-0 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:mt-8 sm:p-6 dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-4 min-w-0 sm:mb-5">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                Recent Sales
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Latest completed transactions
              </p>
            </div>

            <div className="w-full overflow-x-auto rounded-xl">
              {data.recentSales.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No recent sales found.
                </div>
              ) : (
                <table className="w-full min-w-[750px] text-left">

                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Invoice
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Customer
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Items
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Total
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Paid
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Balance
                      </th>

                      <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600 sm:px-4 sm:text-sm dark:text-slate-300">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {data.recentSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >

                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900 sm:px-4 sm:py-4 dark:text-white">
                          {sale.invoiceNumber}
                        </td>

                        <td className="max-w-[180px] truncate px-3 py-3 text-sm text-slate-600 sm:px-4 sm:py-4 dark:text-slate-300">
                          {sale.customerName}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600 sm:px-4 sm:py-4 dark:text-slate-300">
                          {sale.itemCount}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-slate-900 sm:px-4 sm:py-4 dark:text-white">
                          Rs.{" "}
                          {sale.total.toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-emerald-600 sm:px-4 sm:py-4 dark:text-emerald-400">
                          Rs.{" "}
                          {sale.paidAmount.toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-sm text-amber-600 sm:px-4 sm:py-4 dark:text-amber-400">
                          Rs.{" "}
                          {sale.balance.toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 ${
                              sale.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : sale.paymentStatus === "PARTIAL"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              )}
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}