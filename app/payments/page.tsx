"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

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

  const [form, setForm] =
    useState<PaymentForm>(emptyForm);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchPayments() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/payments",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch payments"
        );
      }

      setPayments(data);
    } catch (error) {
      console.error(
        "Fetch payments error:",
        error
      );

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
      const response = await fetch(
        "/api/sales",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch sales"
        );
      }

      setSales(data);
    } catch (error) {
      console.error(
        "Fetch sales error:",
        error
      );
    }
  }

  useEffect(() => {
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
      const remaining =
        sale.total - sale.paidAmount;

      return (
        sale.saleStatus !== "CANCELLED" &&
        remaining > 0
      );
    });
  }, [sales]);

  const selectedSale = useMemo(() => {
    if (!form.saleId) {
      return null;
    }

    return (
      sales.find(
        (sale) =>
          sale.id === Number(form.saleId)
      ) || null
    );
  }, [form.saleId, sales]);

  const remainingBalance = selectedSale
    ? Math.max(
        0,
        selectedSale.total -
          selectedSale.paidAmount
      )
    : 0;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.saleId) {
      setError("Please select a sale");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Payment amount must be greater than 0"
      );
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

      const response = await fetch(
        "/api/payments",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            saleId: Number(form.saleId),
            amount,
            paymentMethod:
              form.paymentMethod,
            note:
              form.note.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add payment"
        );
      }

      setMessage(
        "Payment added successfully"
      );

      setForm(emptyForm);

      await fetchPayments();
      await fetchSales();
    } catch (error) {
      console.error(
        "Add payment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to add payment"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    paymentId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/payments/${paymentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete payment"
        );
      }

      setMessage(
        "Payment deleted successfully"
      );

      await fetchPayments();
      await fetchSales();
    } catch (error) {
      console.error(
        "Delete payment error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete payment"
      );
    }
  }

  const filteredPayments =
    payments.filter((payment) => {
      const searchText =
        search.toLowerCase();

      return (
        payment.sale.invoiceNumber
          .toLowerCase()
          .includes(searchText) ||
        payment.sale.customer?.name
          .toLowerCase()
          .includes(searchText) ||
        payment.paymentMethod
          .toLowerCase()
          .includes(searchText)
      );
    });

  const totalPayments = payments.reduce(
    (total, payment) =>
      total + payment.amount,
    0
  );

  const cashPayments = payments
    .filter(
      (payment) =>
        payment.paymentMethod === "CASH"
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  const cardPayments = payments
    .filter(
      (payment) =>
        payment.paymentMethod === "CARD"
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  const bankPayments = payments
    .filter(
      (payment) =>
        payment.paymentMethod ===
        "BANK_TRANSFER"
    )
    .reduce(
      (total, payment) =>
        total + payment.amount,
      0
    );

  function formatCurrency(
    value: number
  ) {
    return `Rs. ${value.toLocaleString(
      "en-LK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(
    value: string
  ) {
    return new Date(value).toLocaleString(
      "en-LK",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 px-6 py-10">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Payment Management
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              Payments
            </h1>

            <p className="mt-2 text-slate-500">
              Manage customer payments and
              outstanding balances.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Payments
              </p>

              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(
                  totalPayments
                )}
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Cash
              </p>

              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(
                  cashPayments
                )}
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Card
              </p>

              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(
                  cardPayments
                )}
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Bank Transfer
              </p>

              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {formatCurrency(
                  bankPayments
                )}
              </p>
            </div>

          </div>

          <section className="mb-10 rounded-3xl border border-sky-100 bg-white p-7 shadow-sm">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Add Payment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record a payment against an
                outstanding sale.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-5 md:grid-cols-2"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Sale / Invoice *
                </label>

                <select
                  name="saleId"
                  value={form.saleId}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                >
                  <option value="">
                    Select invoice
                  </option>

                  {unpaidSales.map(
                    (sale) => (
                      <option
                        key={sale.id}
                        value={sale.id}
                      >
                        {sale.invoiceNumber} -{" "}
                        {sale.customer
                          ?.name ||
                          "Walk-in Customer"}{" "}
                        - Remaining{" "}
                        {formatCurrency(
                          sale.total -
                            sale.paidAmount
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />

                {selectedSale && (
                  <p className="mt-2 text-xs font-medium text-sky-600">
                    Remaining balance:{" "}
                    {formatCurrency(
                      remainingBalance
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method *
                </label>

                <select
                  name="paymentMethod"
                  value={
                    form.paymentMethod
                  }
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                >
                  <option value="CASH">
                    Cash
                  </option>

                  <option value="CARD">
                    Card
                  </option>

                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                  <option value="CHEQUE">
                    Cheque
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Note
                </label>

                <input
                  type="text"
                  name="note"
                  value={form.note}
                  onChange={handleInputChange}
                  placeholder="Optional note"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-500 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : "Add Payment"}
                </button>
              </div>

            </form>
          </section>

          <section>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Payment History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {payments.length} payment
                  {payments.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search invoice, customer..."
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 md:w-96"
              />

            </div>

            {loading ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-sm">
                <p className="font-medium text-slate-500">
                  Loading payments...
                </p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-sm">

                <div className="text-5xl">
                  💳
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  No payments found
                </h3>

                <p className="mt-2 text-slate-500">
                  Payment records will appear
                  here.
                </p>

              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead className="border-b border-slate-100 bg-slate-50">

                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Invoice
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Customer
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Amount
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Method
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Date
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredPayments.map(
                        (payment) => (
                          <tr
                            key={payment.id}
                            className="transition hover:bg-sky-50/40"
                          >

                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-900">
                                {
                                  payment.sale
                                    .invoiceNumber
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Payment #
                                {
                                  payment.id
                                }
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-medium text-slate-800">
                                {
                                  payment.sale
                                    .customer
                                    ?.name ||
                                  "Walk-in Customer"
                                }
                              </p>

                              {payment.sale
                                .customer
                                ?.phone && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    payment
                                      .sale
                                      .customer
                                      .phone
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-900">
                                {formatCurrency(
                                  payment.amount
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600">
                                {payment.paymentMethod.replace(
                                  "_",
                                  " "
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {formatDate(
                                payment.paymentDate
                              )}
                            </td>

                            <td className="px-6 py-5">

                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                  payment.sale
                                    .paymentStatus ===
                                  "PAID"
                                    ? "bg-green-50 text-green-600"
                                    : "bg-yellow-50 text-yellow-600"
                                }`}
                              >
                                {
                                  payment.sale
                                    .paymentStatus
                                }
                              </span>

                            </td>

                            <td className="px-6 py-5 text-right">

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    payment.id
                                  )
                                }
                                className="rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-500 transition hover:bg-red-100"
                              >
                                Delete
                              </button>

                            </td>

                          </tr>
                        )
                      )}

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