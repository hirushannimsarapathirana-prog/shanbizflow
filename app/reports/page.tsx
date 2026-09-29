"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type ReportData = {
  summary: {
    totalRevenue: number;
    totalSales: number;
    totalPayments: number;
    outstanding: number;
    totalItemsSold: number;
  };

  paymentSummary: {
    CASH: number;
    CARD: number;
    BANK_TRANSFER: number;
    CHEQUE: number;
    OTHER: number;
  };

  salesByDay: {
    date: string;
    revenue: number;
    sales: number;
  }[];

  recentSales: {
    id: number;
    invoiceNumber: string;
    customerName: string;
    total: number;
    paidAmount: number;
    balance: number;
    paymentStatus: string;
    createdAt: string;
  }[];
};

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(
    "en-LK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(
    null
  );

  const [range, setRange] = useState("month");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      let url = `/api/reports?range=${range}`;

      if (
        range === "custom" &&
        startDate &&
        endDate
      ) {
        url += `&start=${startDate}&end=${endDate}`;
      }

      const response = await fetch(url, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load reports"
        );
      }

      setData(result);
    } catch (error) {
      console.error("Reports loading error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      range === "custom" &&
      (!startDate || !endDate)
    ) {
      return;
    }

    loadReports();
  }, [range, startDate, endDate]);

  const maxRevenue = useMemo(() => {
    if (!data?.salesByDay.length) {
      return 1;
    }

    return Math.max(
      ...data.salesByDay.map(
        (item) => item.revenue
      ),
      1
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />

        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse">
              <div className="h-10 w-48 rounded bg-slate-200" />

              <div className="mt-3 h-5 w-80 rounded bg-slate-200" />

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({
                  length: 4,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 rounded-2xl bg-white shadow-sm"
                  />
                ))}
              </div>

              <div className="mt-8 h-96 rounded-2xl bg-white shadow-sm" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />

        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              <h2 className="text-lg font-bold">
                Failed to load reports
              </h2>

              <p className="mt-2 text-sm">
                {error}
              </p>

              <button
                onClick={loadReports}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
                Business Analytics
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                Reports
              </h1>

              <p className="mt-2 text-slate-500">
                Monitor sales, payments and business
                performance.
              </p>
            </div>

            {/* Date Filter */}
            <div className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    value: "today",
                    label: "Today",
                  },
                  {
                    value: "month",
                    label: "This Month",
                  },
                  {
                    value: "year",
                    label: "This Year",
                  },
                  {
                    value: "custom",
                    label: "Custom",
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setRange(item.value)
                    }
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      range === item.value
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {range === "custom" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-xl">
                  💰
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Revenue
                </span>
              </div>

              <p className="mt-5 text-3xl font-extrabold text-slate-900">
                {formatCurrency(
                  data.summary.totalRevenue
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Total sales revenue
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-xl">
                  🧾
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sales
                </span>
              </div>

              <p className="mt-5 text-3xl font-extrabold text-slate-900">
                {data.summary.totalSales}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Completed transactions
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-xl">
                  💳
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Payments
                </span>
              </div>

              <p className="mt-5 text-3xl font-extrabold text-slate-900">
                {formatCurrency(
                  data.summary.totalPayments
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Amount collected
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-xl">
                  ⚠️
                </div>

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Outstanding
                </span>
              </div>

              <p className="mt-5 text-3xl font-extrabold text-slate-900">
                {formatCurrency(
                  data.summary.outstanding
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Remaining customer balance
              </p>
            </div>
          </div>

          {/* Bar Graph */}
          <section className="mt-8 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sales Revenue
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Daily revenue for the selected period
                </p>
              </div>

              <div className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600">
                {data.summary.totalSales} sales
              </div>
            </div>

            {data.salesByDay.length === 0 ? (
              <div className="flex h-80 items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl">
                    📊
                  </div>

                  <p className="mt-3 font-semibold text-slate-700">
                    No sales data
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    There are no completed sales for
                    this period.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 overflow-x-auto">
                <div
                  className="flex min-w-[700px] items-end gap-3"
                  style={{
                    height: "320px",
                  }}
                >
                  {data.salesByDay.map(
                    (item) => {
                      const height =
                        Math.max(
                          (item.revenue /
                            maxRevenue) *
                            240,
                          8
                        );

                      return (
                        <div
                          key={item.date}
                          className="group flex min-w-[42px] flex-1 flex-col items-center justify-end"
                        >
                          <div className="mb-2 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white group-hover:block">
                            {formatCurrency(
                              item.revenue
                            )}
                          </div>

                          <div
                            className="w-full max-w-[48px] rounded-t-xl bg-sky-500 transition-all duration-300 hover:bg-sky-600"
                            style={{
                              height: `${height}px`,
                            }}
                            title={`${formatCurrency(
                              item.revenue
                            )} - ${
                              item.sales
                            } sales`}
                          />

                          <div className="mt-3 text-center">
                            <p className="text-xs font-medium text-slate-500">
                              {new Date(
                                `${item.date}T00:00:00`
                              ).toLocaleDateString(
                                "en-LK",
                                {
                                  day: "2-digit",
                                  month: "short",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Payment Summary + Items */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Payment Methods */}
            <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Payment Methods
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Collected payment breakdown
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Cash",
                    key: "CASH",
                    icon: "💵",
                  },
                  {
                    label: "Card",
                    key: "CARD",
                    icon: "💳",
                  },
                  {
                    label: "Bank Transfer",
                    key: "BANK_TRANSFER",
                    icon: "🏦",
                  },
                  {
                    label: "Cheque",
                    key: "CHEQUE",
                    icon: "🧾",
                  },
                  {
                    label: "Other",
                    key: "OTHER",
                    icon: "💰",
                  },
                ].map((method) => {
                  const amount =
                    data.paymentSummary[
                      method.key as keyof typeof data.paymentSummary
                    ];

                  const percentage =
                    data.summary.totalPayments >
                    0
                      ? (amount /
                          data.summary
                            .totalPayments) *
                        100
                      : 0;

                  return (
                    <div
                      key={method.key}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                            {method.icon}
                          </span>

                          <span className="font-medium text-slate-700">
                            {method.label}
                          </span>
                        </div>

                        <span className="font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sales Overview */}
            <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Business activity for selected period
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl bg-sky-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Items Sold
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-sky-600">
                    {data.summary.totalItemsSold}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Average Sale
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-slate-900">
                    {formatCurrency(
                      data.summary.totalSales >
                        0
                        ? data.summary
                            .totalRevenue /
                          data.summary
                            .totalSales
                        : 0
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Collected
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                    {formatCurrency(
                      data.summary.totalPayments
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Credit
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-orange-600">
                    {formatCurrency(
                      data.summary.outstanding
                    )}
                  </p>
                </div>

              </div>
            </section>
          </div>

          {/* Recent Sales */}
          <section className="mt-8 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">

            <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Sales
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest completed transactions
                </p>
              </div>
            </div>

            {data.recentSales.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-700">
                  No sales found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Invoice
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Paid
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Balance
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentSales.map(
                      (sale) => (
                        <tr
                          key={sale.id}
                          className="border-b border-slate-50 transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-sky-600">
                              {sale.invoiceNumber}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-700">
                            {sale.customerName}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(
                              sale.createdAt
                            )}
                          </td>

                          <td className="px-6 py-4 text-right font-semibold text-slate-900">
                            {formatCurrency(
                              sale.total
                            )}
                          </td>

                          <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                            {formatCurrency(
                              sale.paidAmount
                            )}
                          </td>

                          <td className="px-6 py-4 text-right font-semibold text-orange-600">
                            {formatCurrency(
                              sale.balance
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                sale.paymentStatus ===
                                "PAID"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : sale.paymentStatus ===
                                    "PARTIAL"
                                  ? "bg-yellow-50 text-yellow-600"
                                  : "bg-orange-50 text-orange-600"
                              }`}
                            >
                              {
                                sale.paymentStatus
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}