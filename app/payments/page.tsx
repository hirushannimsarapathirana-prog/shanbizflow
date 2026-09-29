"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Sale = {
  id: number;
  invoiceNumber: string;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  saleStatus: string;
  customer: Customer | null;
};

type Payment = {
  id: number;
  saleId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  note: string | null;
  sale: Sale;
};

type PaymentForm = {
  saleId: string;
  amount: string;
  paymentMethod: string;
  note: string;
};

const emptyForm: PaymentForm = {
  saleId: "",
  amount: "",
  paymentMethod: "CASH",
  note: "",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canAddPayment =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "STAFF";

  const canDeletePayment =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  async function fetchCurrentUser() {
    try {
      setUserLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch current user");
      }

      if (data.user?.role) {
        setUserRole(data.user.role);
      }
    } catch (error) {
      console.error("Fetch current user error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to verify user permissions"
      );
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchPayments() {
    try {
      setLoading(true);

      const response = await fetch("/api/payments", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch payments");
      }

      setPayments(data);
    } catch (error) {
      console.error("Fetch payments error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load payments"
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchSales() {
    try {
      const response = await fetch("/api/sales", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sales");
      }

      setSales(data);
    } catch (error) {
      console.error("Fetch sales error:", error);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchPayments();
    fetchSales();
  }, []);

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const unpaidSales = useMemo(() => {
    return sales.filter((sale) => {
      const remaining = sale.total - sale.paidAmount;

      return sale.saleStatus !== "CANCELLED" && remaining > 0;
    });
  }, [sales]);

  const selectedSale = useMemo(() => {
    if (!form.saleId) {
      return null;
    }

    return (
      sales.find((sale) => sale.id === Number(form.saleId)) || null
    );
  }, [form.saleId, sales]);

  const remainingBalance = selectedSale
    ? Math.max(0, selectedSale.total - selectedSale.paidAmount)
    : 0;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!canAddPayment) {
      setError("You do not have permission to add payments");
      return;
    }

    if (!form.saleId) {
      setError("Please select a sale");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    if (amount > remainingBalance) {
      setError(
        `Payment cannot exceed remaining balance of Rs. ${remainingBalance.toLocaleString(
          "en-LK",
          {
            minimumFractionDigits: 2,
          }
        )}`
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/payments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: Number(form.saleId),
          amount,
          paymentMethod: form.paymentMethod,
          note: form.note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add payment");
      }

      setMessage("Payment added successfully");
      setForm(emptyForm);

      await fetchPayments();
      await fetchSales();
    } catch (error) {
      console.error("Add payment error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add payment"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(paymentId: number) {
    if (!canDeletePayment) {
      setError("You do not have permission to delete payments");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete payment");
      }

      setMessage("Payment deleted successfully");

      await fetchPayments();
      await fetchSales();
    } catch (error) {
      console.error("Delete payment error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete payment"
      );
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const searchText = search.toLowerCase();

    return (
      payment.sale.invoiceNumber.toLowerCase().includes(searchText) ||
      payment.sale.customer?.name.toLowerCase().includes(searchText) ||
      payment.paymentMethod.toLowerCase().includes(searchText)
    );
  });

  const totalPayments = payments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const cashPayments = payments
    .filter((payment) => payment.paymentMethod === "CASH")
    .reduce((total, payment) => total + payment.amount, 0);

  const cardPayments = payments
    .filter((payment) => payment.paymentMethod === "CARD")
    .reduce((total, payment) => total + payment.amount, 0);

  const bankPayments = payments
    .filter((payment) => payment.paymentMethod === "BANK_TRANSFER")
    .reduce((total, payment) => total + payment.amount, 0);

  function formatCurrency(value: number) {
    return `Rs. ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:ml-64 lg:px-8 lg:py-10">
        <div className="mx-auto min-w-0 max-w-7xl">

          <div className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-500 sm:text-sm">
                Payment Management
              </p>

              {!userLoading && userRole && (
                <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                  {userRole.replace("_", " ")}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Payments
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base dark:text-slate-400">
              Manage customer payments and outstanding balances.
            </p>
          </div>

          {message && (
            <div className="mb-6 break-words rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm font-medium text-green-700 sm:px-5 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 break-words rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 sm:px-5 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-4 sm:gap-5 md:grid-cols-2 xl:mb-10 xl:grid-cols-4">

            <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Payments
              </p>

              <p className="mt-3 break-words text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                {formatCurrency(totalPayments)}
              </p>
            </div>

            <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Cash
              </p>

              <p className="mt-3 break-words text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                {formatCurrency(cashPayments)}
              </p>
            </div>

            <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Card
              </p>

              <p className="mt-3 break-words text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                {formatCurrency(cardPayments)}
              </p>
            </div>

            <div className="min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Bank Transfer
              </p>

              <p className="mt-3 break-words text-xl font-extrabold text-slate-900 sm:text-2xl dark:text-white">
                {formatCurrency(bankPayments)}
              </p>
            </div>

          </div>

          <section className="mb-8 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm sm:mb-10 sm:p-7 dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                Add Payment
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Record a payment against an outstanding sale.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid min-w-0 gap-5 md:grid-cols-2"
            >

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Sale / Invoice *
                </label>

                <select
                  name="saleId"
                  value={form.saleId}
                  onChange={handleInputChange}
                  disabled={userLoading}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-950"
                >
                  <option value="">Select invoice</option>

                  {unpaidSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoiceNumber} -{" "}
                      {sale.customer?.name || "Walk-in Customer"} - Remaining{" "}
                      {formatCurrency(sale.total - sale.paidAmount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount *
                </label>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  max={remainingBalance || undefined}
                  placeholder="Enter amount"
                  disabled={userLoading}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-sky-950"
                />

                {selectedSale && (
                  <p className="mt-2 break-words text-xs font-medium text-sky-600 dark:text-sky-400">
                    Remaining balance:{" "}
                    {formatCurrency(remainingBalance)}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method *
                </label>

                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleInputChange}
                  disabled={userLoading}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-950"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Note
                </label>

                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleInputChange}
                  placeholder="Optional note"
                  disabled={userLoading}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-sky-950"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    userLoading ||
                    !canAddPayment
                  }
                  className="w-full rounded-xl bg-sky-500 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving
                    ? "Saving..."
                    : userLoading
                    ? "Checking permissions..."
                    : "Add Payment"}
                </button>
              </div>

            </form>
          </section>

          <section>

            <div className="mb-6 flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  Payment History
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {payments.length} payment
                  {payments.length !== 1 ? "s" : ""}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, customer..."
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 sm:px-5 md:w-full md:max-w-96 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-sky-950"
              />

            </div>

            {loading ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-10 text-center shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-500 dark:text-slate-400">
                  Loading payments...
                </p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-10 text-center shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900">

                <div className="text-5xl">💳</div>

                <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                  No payments found
                </h3>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Payment records will appear here.
                </p>

              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                      <tr>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Invoice
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Customer
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Amount
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Method
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Date
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Status
                        </th>

                        {canDeletePayment && (
                          <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                            Action
                          </th>
                        )}

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                      {filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-sky-50/40 dark:hover:bg-slate-800/60"
                        >

                          <td className="px-5 py-5 sm:px-6">
                            <p className="whitespace-nowrap font-bold text-slate-900 dark:text-white">
                              {payment.sale.invoiceNumber}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Payment #{payment.id}
                            </p>
                          </td>

                          <td className="px-5 py-5 sm:px-6">
                            <p className="max-w-48 truncate font-medium text-slate-800 dark:text-slate-200">
                              {payment.sale.customer?.name ||
                                "Walk-in Customer"}
                            </p>

                            {payment.sale.customer?.phone && (
                              <p className="mt-1 text-xs text-slate-400">
                                {payment.sale.customer.phone}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-5 sm:px-6">
                            <p className="whitespace-nowrap font-bold text-slate-900 dark:text-white">
                              {formatCurrency(payment.amount)}
                            </p>
                          </td>

                          <td className="px-5 py-5 sm:px-6">
                            <span className="whitespace-nowrap rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                              {payment.paymentMethod.replace("_", " ")}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600 sm:px-6 dark:text-slate-400">
                            {formatDate(payment.paymentDate)}
                          </td>

                          <td className="px-5 py-5 sm:px-6">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                                payment.sale.paymentStatus === "PAID"
                                  ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                                  : "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300"
                              }`}
                            >
                              {payment.sale.paymentStatus}
                            </span>
                          </td>

                          {canDeletePayment && (
                            <td className="px-5 py-5 text-right sm:px-6">

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(payment.id)
                                }
                                className="whitespace-nowrap rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-500 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950"
                              >
                                Delete
                              </button>

                            </td>
                          )}

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}

