import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
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
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const secret = new TextEncoder().encode(jwtSecret);

  try {
    await jwtVerify(token, secret);
  } catch {
    redirect("/login");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/dashboard`, {
    headers: {
      Cookie: `auth_token=${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    throw new Error(
      "You do not have permission to view the dashboard"
    );
  }

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return response.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Welcome back. Here is your business overview.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                Rs. {data.summary.totalRevenue.toLocaleString()}
              </h2>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Orders
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {data.summary.totalOrders}
              </h2>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Customers
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {data.summary.totalCustomers}
              </h2>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Products
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {data.summary.totalProducts}
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Financial Overview
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total Paid
                  </span>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    Rs. {data.summary.totalPaid.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Outstanding
                  </span>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    Rs.{" "}
                    {data.summary.totalOutstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Low Stock Products
              </h2>

              <div className="mt-5 space-y-3">
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No low-stock products.
                  </p>
                ) : (
                  data.lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                    >
                      <span className="font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </span>

                      <span className="font-semibold text-red-500">
                        {product.stock} left
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Recent Sales
            </h2>

            <div className="mt-5 overflow-x-auto">
              {data.recentSales.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No recent sales found.
                </p>
              ) : (
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Invoice
                      </th>

                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Customer
                      </th>

                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Total
                      </th>

                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Balance
                      </th>

                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                          {sale.invoiceNumber}
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {sale.customerName}
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          Rs. {sale.total.toLocaleString()}
                        </td>

                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          Rs. {sale.balance.toLocaleString()}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
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