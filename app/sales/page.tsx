"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

type Customer = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
};

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

type CartItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type CreatedSale = {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  saleStatus: string;
  createdAt: string;
  customer: Customer | null;
  items: {
    id: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: {
      id: number;
      name: string;
    };
  }[];
  payments: {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    note: string | null;
  }[];
};

export default function SalesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<CreatedSale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [discountPercent, setDiscountPercent] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNote, setPaymentNote] = useState("");

  const [createdSale, setCreatedSale] =
    useState<CreatedSale | null>(null);

  const [userRole, setUserRole] =
    useState<UserRole | null>(null);

  const [userLoading, setUserLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingSaleId, setCancellingSaleId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canCreateSale =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "STAFF";

  const canCancelSale =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  async function loadCurrentUser() {
    try {
      setUserLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.user?.role) {
        setUserRole(data.user.role as UserRole);
      }
    } catch (error) {
      console.error("Load current user error:", error);
    } finally {
      setUserLoading(false);
    }
  }

  async function loadData() {
    try {
      setLoading(true);

      const [customersResponse, productsResponse] =
        await Promise.all([
          fetch("/api/customers", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/products", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      const customersData =
        await customersResponse.json();

      const productsData =
        await productsResponse.json();

      if (!customersResponse.ok) {
        throw new Error(
          customersData.error ||
            "Failed to load customers"
        );
      }

      if (!productsResponse.ok) {
        throw new Error(
          productsData.error ||
            "Failed to load products"
        );
      }

      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Load sales data error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSales() {
    try {
      setSalesLoading(true);

      const response = await fetch("/api/sales", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load sales"
        );
      }

      setSales(data);
    } catch (error) {
      console.error("Load sales error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load sales"
      );
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
    loadData();
    loadSales();
  }, []);

  const selectedProduct = products.find(
    (product) =>
      product.id === Number(productId)
  );

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.subtotal,
      0
    );
  }, [cart]);

  const cleanDiscountPercent =
    Number(discountPercent || 0);

  const discountAmount =
    subtotal *
    (cleanDiscountPercent / 100);

  const total = Math.max(
    0,
    subtotal - discountAmount
  );

  const cleanPaidAmount =
    Number(paidAmount || 0);

  const balance = Math.max(
    0,
    total - cleanPaidAmount
  );

  const paymentStatus =
    cleanPaidAmount === total &&
    total > 0
      ? "PAID"
      : cleanPaidAmount > 0
        ? "PARTIAL"
        : "CREDIT";

  function addProduct() {
    setError("");
    setMessage("");

    if (!canCreateSale) {
      setError(
        "You do not have permission to create sales."
      );
      return;
    }

    if (!selectedProduct) {
      setError("Please select a product");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Quantity must be greater than 0"
      );
      return;
    }

    const existingItem = cart.find(
      (item) =>
        item.productId ===
        selectedProduct.id
    );

    const currentQuantity =
      existingItem?.quantity || 0;

    if (
      currentQuantity + quantity >
      selectedProduct.stock
    ) {
      setError(
        `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available`
      );
      return;
    }

    if (existingItem) {
      setCart((previous) =>
        previous.map((item) =>
          item.productId ===
          selectedProduct.id
            ? {
                ...item,
                quantity:
                  item.quantity +
                  quantity,
                subtotal:
                  (item.quantity +
                    quantity) *
                  item.unitPrice,
              }
            : item
        )
      );
    } else {
      setCart((previous) => [
        ...previous,
        {
          productId:
            selectedProduct.id,
          name: selectedProduct.name,
          quantity,
          unitPrice:
            selectedProduct.price,
          subtotal:
            selectedProduct.price *
            quantity,
        },
      ]);
    }

    setProductId("");
    setQuantity(1);
  }

  function updateQuantity(
    productId: number,
    newQuantity: number
  ) {
    if (!canCreateSale) {
      setError(
        "You do not have permission to modify sales."
      );
      return;
    }

    const product = products.find(
      (item) =>
        item.id === productId
    );

    if (!product) {
      return;
    }

    if (newQuantity < 1) {
      removeItem(productId);
      return;
    }

    if (
      newQuantity > product.stock
    ) {
      setError(
        `Only ${product.stock} units of ${product.name} are available`
      );
      return;
    }

    setError("");

    setCart((previous) =>
      previous.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal:
                newQuantity *
                item.unitPrice,
            }
          : item
      )
    );
  }

  function removeItem(productId: number) {
    if (!canCreateSale) {
      setError(
        "You do not have permission to modify sales."
      );
      return;
    }

    setCart((previous) =>
      previous.filter(
        (item) =>
          item.productId !==
          productId
      )
    );
  }

  function clearSale() {
    setCustomerId("");
    setProductId("");
    setQuantity(1);
    setDiscountPercent("");
    setPaidAmount("");
    setPaymentMethod("CASH");
    setPaymentNote("");
    setCart([]);
    setMessage("");
    setError("");
    setCreatedSale(null);
  }

  async function handleCreateSale() {
    setMessage("");
    setError("");

    if (!canCreateSale) {
      setError(
        "You do not have permission to create sales."
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "Please add at least one product"
      );
      return;
    }

    if (
      cleanDiscountPercent < 0 ||
      cleanDiscountPercent > 100
    ) {
      setError(
        "Discount percentage must be between 0% and 100%"
      );
      return;
    }

    if (
      cleanPaidAmount < 0 ||
      cleanPaidAmount > total
    ) {
      setError(
        "Paid amount cannot be greater than total"
      );
      return;
    }

    if (
      cleanPaidAmount > 0 &&
      !paymentMethod
    ) {
      setError(
        "Please select a payment method"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            customerId: customerId
              ? Number(customerId)
              : null,
            items: cart.map((item) => ({
              productId:
                item.productId,
              quantity:
                item.quantity,
            })),
            discount:
              Number(
                discountAmount.toFixed(2)
              ),
            paidAmount:
              cleanPaidAmount,
            paymentMethod:
              cleanPaidAmount > 0
                ? paymentMethod
                : null,
            paymentNote,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create sale"
        );
      }

      setCreatedSale(data.sale);

      setMessage(
        `Sale created successfully. Invoice: ${data.sale.invoiceNumber}`
      );

      setCustomerId("");
      setProductId("");
      setQuantity(1);
      setDiscountPercent("");
      setPaidAmount("");
      setPaymentMethod("CASH");
      setPaymentNote("");
      setCart([]);

      await Promise.all([
        loadData(),
        loadSales(),
      ]);
    } catch (error) {
      console.error(
        "Create sale error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create sale"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSale(
    saleId: number
  ) {
    if (!canCancelSale) {
      setError(
        "You do not have permission to cancel sales."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this sale? The sold stock will be restored."
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingSaleId(saleId);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/sales/${saleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "CANCEL",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to cancel sale"
        );
      }

      setMessage(
        `Sale ${data.sale.invoiceNumber} cancelled successfully. Stock has been restored.`
      );

      await Promise.all([
        loadSales(),
        loadData(),
      ]);
    } catch (error) {
      console.error(
        "Cancel sale error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to cancel sale"
      );
    } finally {
      setCancellingSaleId(null);
    }
  }

  function printBill() {
    window.print();
  }

  function formatDate(date: string) {
    return new Date(
      date
    ).toLocaleString("en-LK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <div className="no-print">
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

          <DashboardSidebar />

          <main className="min-w-0 flex-1 px-6 py-10 lg:ml-64">
            <div className="mx-auto max-w-7xl">

              <div className="mb-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
                      Sales Management
                    </p>

                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      Create Sale
                    </h1>

                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                      Create sales, manage products and record payments.
                    </p>
                  </div>

                  {userLoading ? (
                    <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Checking permissions...
                    </div>
                  ) : (
                    <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-bold text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                      Role: {userRole || "UNKNOWN"}
                    </div>
                  )}

                </div>
              </div>

              {message && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                  {message}
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}

              {createdSale && (
                <div className="mb-8 rounded-3xl border border-sky-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-green-500">
                        Sale Completed
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {createdSale.invoiceNumber}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Your bill is ready to print.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={printBill}
                      className="rounded-xl bg-sky-500 px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-sky-600"
                    >
                      🖨️ Print Bill
                    </button>

                  </div>
                </div>
              )}

              {userLoading || loading ? (
                <div className="rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-medium text-slate-500 dark:text-slate-400">
                    {userLoading
                      ? "Checking permissions..."
                      : "Loading sales data..."}
                  </p>
                </div>
              ) : !canCreateSale ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center shadow-sm dark:border-red-900 dark:bg-red-950/30">
                  <div className="text-4xl">
                    🔒
                  </div>

                  <h2 className="mt-4 text-xl font-bold text-red-700 dark:text-red-400">
                    Access Denied
                  </h2>

                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    You do not have permission to create sales.
                  </p>
                </div>
              ) : (
                <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">

                  <section className="rounded-3xl border border-sky-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="mb-7">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Sale Details
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Select a customer and add products.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Customer
                        </label>

                        <select
                          value={customerId}
                          onChange={(event) =>
                            setCustomerId(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                        >
                          <option value="">
                            Walk-in Customer
                          </option>

                          {customers.map(
                            (customer) => (
                              <option
                                key={
                                  customer.id
                                }
                                value={
                                  customer.id
                                }
                              >
                                {
                                  customer.name
                                }{" "}
                                -{" "}
                                {
                                  customer.phone
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Product
                        </label>

                        <select
                          value={productId}
                          onChange={(event) =>
                            setProductId(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                        >
                          <option value="">
                            Select Product
                          </option>

                          {products.map(
                            (product) => (
                              <option
                                key={
                                  product.id
                                }
                                value={
                                  product.id
                                }
                                disabled={
                                  product.stock ===
                                  0
                                }
                              >
                                {
                                  product.name
                                }{" "}
                                — Rs.{" "}
                                {product.price.toLocaleString()}{" "}
                                — Stock:{" "}
                                {
                                  product.stock
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(event) =>
                            setQuantity(
                              Number(
                                event.target.value
                              )
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={
                            addProduct
                          }
                          className="w-full rounded-xl bg-sky-500 px-6 py-3.5 font-semibold text-white transition hover:bg-sky-600"
                        >
                          + Add Product
                        </button>
                      </div>

                    </div>

                    <div className="mt-8">

                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Sale Items
                        </h3>

                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                          {cart.length}{" "}
                          item
                          {cart.length !==
                          1
                            ? "s"
                            : ""}
                        </span>
                      </div>

                      {cart.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">

                          <div className="text-4xl">
                            🛒
                          </div>

                          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
                            No products added
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            Select a product above to add it.
                          </p>

                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">

                          <div className="hidden grid-cols-[1fr_110px_150px_40px] gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400 md:grid">
                            <span>
                              Product
                            </span>

                            <span>
                              Quantity
                            </span>

                            <span>
                              Subtotal
                            </span>

                            <span></span>
                          </div>

                          {cart.map(
                            (item) => (
                              <div
                                key={
                                  item.productId
                                }
                                className="grid gap-4 border-t border-slate-100 px-5 py-5 dark:border-slate-800 md:grid-cols-[1fr_110px_150px_40px] md:items-center"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">
                                    {
                                      item.name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    Rs.{" "}
                                    {item.unitPrice.toLocaleString()}{" "}
                                    each
                                  </p>
                                </div>

                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateQuantity(
                                      item.productId,
                                      Number(
                                        event.target
                                          .value
                                      )
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />

                                <p className="font-bold text-slate-900 dark:text-white">
                                  Rs.{" "}
                                  {item.subtotal.toLocaleString()}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem(
                                      item.productId
                                    )
                                  }
                                  className="rounded-lg px-2 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>

                  </section>

                  <section className="h-fit rounded-3xl border border-sky-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Payment
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review totals and record payment.
                    </p>

                    <div className="mt-7 space-y-5">

                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>
                          Subtotal
                        </span>

                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rs.{" "}
                          {subtotal.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Discount (%)
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={
                              discountPercent
                            }
                            onChange={(
                              event
                            ) =>
                              setDiscountPercent(
                                event.target
                                  .value
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                            %
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-slate-400">
                            Discount Amount
                          </span>

                          <span className="font-semibold text-red-500">
                            - Rs.{" "}
                            {discountAmount.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Total
                          </span>

                          <span className="text-2xl font-extrabold text-sky-600">
                            Rs.{" "}
                            {total.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Paid Amount
                        </label>

                        <input
                          type="number"
                          min="0"
                          max={total}
                          step="0.01"
                          value={
                            paidAmount
                          }
                          onChange={(
                            event
                          ) =>
                            setPaidAmount(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter amount customer pays"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                          Amount received from customer
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            Balance
                          </span>

                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            Rs.{" "}
                            {balance.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Total − Paid Amount
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Payment Method
                        </label>

                        <select
                          value={
                            paymentMethod
                          }
                          onChange={(
                            event
                          ) =>
                            setPaymentMethod(
                              event.target
                                .value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
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
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Payment Note
                        </label>

                        <textarea
                          value={
                            paymentNote
                          }
                          onChange={(
                            event
                          ) =>
                            setPaymentNote(
                              event.target
                                .value
                            )
                          }
                          rows={3}
                          placeholder="Optional payment note"
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-sky-900/30"
                        />
                      </div>

                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Payment Status
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sky-600 dark:bg-slate-800 dark:text-sky-400">
                            {
                              paymentStatus
                            }
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 pt-3">

                        <button
                          type="button"
                          onClick={
                            handleCreateSale
                          }
                          disabled={
                            saving ||
                            cart.length ===
                              0
                          }
                          className="rounded-xl bg-sky-500 px-6 py-4 font-bold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving
                            ? "Creating Sale..."
                            : "Create Sale"}
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearSale
                          }
                          disabled={
                            saving
                          }
                          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Clear
                        </button>

                      </div>

                    </div>

                  </section>

                </div>
              )}

              <section className="mt-10 rounded-3xl border border-sky-100 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
                      Transaction Records
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      Sales History
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      View completed and cancelled sales.
                    </p>
                  </div>

                  <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                    {sales.length} Sales
                  </div>

                </div>

                {salesLoading ? (
                  <div className="rounded-2xl bg-slate-50 p-10 text-center dark:bg-slate-800">
                    <p className="font-medium text-slate-500 dark:text-slate-400">
                      Loading sales history...
                    </p>
                  </div>
                ) : sales.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/50">

                    <div className="text-4xl">
                      📋
                    </div>

                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
                      No sales found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Created sales will appear here.
                    </p>

                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">

                    <table className="w-full min-w-[1100px] text-left">

                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">

                          <th className="px-5 py-4">
                            Invoice
                          </th>

                          <th className="px-5 py-4">
                            Customer
                          </th>

                          <th className="px-5 py-4">
                            Date
                          </th>

                          <th className="px-5 py-4 text-right">
                            Total
                          </th>

                          <th className="px-5 py-4 text-right">
                            Paid
                          </th>

                          <th className="px-5 py-4 text-right">
                            Balance
                          </th>

                          <th className="px-5 py-4">
                            Payment
                          </th>

                          <th className="px-5 py-4">
                            Status
                          </th>

                          {canCancelSale && (
                            <th className="px-5 py-4 text-right">
                              Action
                            </th>
                          )}

                        </tr>
                      </thead>

                      <tbody>

                        {sales.map((sale) => {

                          const saleBalance =
                            Math.max(
                              sale.total -
                                sale.paidAmount,
                              0
                            );

                          const isCancelled =
                            sale.saleStatus ===
                            "CANCELLED";

                          return (
                            <tr
                              key={sale.id}
                              className="border-t border-slate-100 dark:border-slate-800"
                            >

                              <td className="px-5 py-5">
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {
                                    sale.invoiceNumber
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  #{sale.id}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {sale.customer?.name ||
                                    "Walk-in Customer"}
                                </p>

                                {sale.customer?.phone && (
                                  <p className="mt-1 text-xs text-slate-400">
                                    {
                                      sale.customer.phone
                                    }
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-5 text-sm text-slate-500 dark:text-slate-400">
                                {formatDate(
                                  sale.createdAt
                                )}
                              </td>

                              <td className="px-5 py-5 text-right font-bold text-slate-900 dark:text-white">
                                Rs.{" "}
                                {sale.total.toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="px-5 py-5 text-right font-semibold text-green-600">
                                Rs.{" "}
                                {sale.paidAmount.toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="px-5 py-5 text-right font-semibold text-orange-500">
                                Rs.{" "}
                                {saleBalance.toLocaleString(
                                  undefined,
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>

                              <td className="px-5 py-5">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {sale.payments[0]
                                    ?.paymentMethod ||
                                    "CREDIT"}
                                </span>
                              </td>

                              <td className="px-5 py-5">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    isCancelled
                                      ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                                      : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                                  }`}
                                >
                                  {isCancelled
                                    ? "CANCELLED"
                                    : "COMPLETED"}
                                </span>

                              </td>

                              {canCancelSale && (
                                <td className="px-5 py-5 text-right">

                                  {!isCancelled ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCancelSale(
                                          sale.id
                                        )
                                      }
                                      disabled={
                                        cancellingSaleId ===
                                        sale.id
                                      }
                                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                                    >
                                      {cancellingSaleId ===
                                      sale.id
                                        ? "Cancelling..."
                                        : "Cancel Sale"}
                                    </button>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-400">
                                      Cancelled
                                    </span>
                                  )}

                                </td>
                              )}

                            </tr>
                          );
                        })}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>

            </div>
          </main>
        </div>
      </div>

      {createdSale && (
        <div className="print-bill">
          <div className="mx-auto w-full max-w-3xl px-8 py-8 text-black">

            <div className="border-b-2 border-black pb-5 text-center">
              <h1 className="text-3xl font-extrabold">
                SHANBIZFLOW
              </h1>

              <p className="mt-1 text-sm">
                Business Management System
              </p>

              <p className="mt-1 text-xs">
                Sales Invoice
              </p>
            </div>

            <div className="mt-6 flex justify-between">

              <div>
                <p className="text-xs font-semibold uppercase">
                  Invoice
                </p>

                <p className="mt-1 text-lg font-bold">
                  {
                    createdSale.invoiceNumber
                  }
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase">
                  Date
                </p>

                <p className="mt-1 text-sm">
                  {formatDate(
                    createdSale.createdAt
                  )}
                </p>
              </div>

            </div>

            <div className="mt-7 border-y border-black py-4">

              <p className="text-xs font-semibold uppercase">
                Customer
              </p>

              {createdSale.customer ? (
                <>
                  <p className="mt-1 font-bold">
                    {
                      createdSale.customer.name
                    }
                  </p>

                  <p className="text-sm">
                    {
                      createdSale.customer.phone
                    }
                  </p>

                  {createdSale.customer.email && (
                    <p className="text-sm">
                      {
                        createdSale.customer.email
                      }
                    </p>
                  )}

                  {createdSale.customer.address && (
                    <p className="text-sm">
                      {
                        createdSale.customer.address
                      }
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 font-bold">
                  Walk-in Customer
                </p>
              )}

            </div>

            <table className="mt-7 w-full border-collapse">

              <thead>
                <tr className="border-b-2 border-black text-left">

                  <th className="py-3 pr-3">
                    Product
                  </th>

                  <th className="px-3 py-3 text-center">
                    Qty
                  </th>

                  <th className="px-3 py-3 text-right">
                    Unit Price
                  </th>

                  <th className="py-3 pl-3 text-right">
                    Amount
                  </th>

                </tr>
              </thead>

              <tbody>
                {createdSale.items.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-300"
                    >

                      <td className="py-3 pr-3">
                        {
                          item.product.name
                        }
                      </td>

                      <td className="px-3 py-3 text-center">
                        {
                          item.quantity
                        }
                      </td>

                      <td className="px-3 py-3 text-right">
                        Rs.{" "}
                        {item.unitPrice.toLocaleString()}
                      </td>

                      <td className="py-3 pl-3 text-right font-semibold">
                        Rs.{" "}
                        {item.subtotal.toLocaleString()}
                      </td>

                    </tr>
                  )
                )}
              </tbody>

            </table>

            <div className="ml-auto mt-7 w-full max-w-sm space-y-3">

              <div className="flex justify-between">
                <span>
                  Subtotal
                </span>

                <span>
                  Rs.{" "}
                  {createdSale.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Discount
                </span>

                <span>
                  Rs.{" "}
                  {createdSale.discount.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t-2 border-black pt-3 text-xl font-extrabold">
                <span>
                  TOTAL
                </span>

                <span>
                  Rs.{" "}
                  {createdSale.total.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Paid Amount
                </span>

                <span>
                  Rs.{" "}
                  {createdSale.paidAmount.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between font-bold">
                <span>
                  Balance
                </span>

                <span>
                  Rs.{" "}
                  {(
                    createdSale.total -
                    createdSale.paidAmount
                  ).toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-400 pt-3">
                <span>
                  Payment Status
                </span>

                <span className="font-bold">
                  {
                    createdSale.paymentStatus
                  }
                </span>
              </div>

              {createdSale.payments.length >
                0 && (
                <div className="flex justify-between">
                  <span>
                    Payment Method
                  </span>

                  <span className="font-bold">
                    {
                      createdSale.payments[0]
                        .paymentMethod
                    }
                  </span>
                </div>
              )}

            </div>

            <div className="mt-12 border-t-2 border-black pt-5 text-center">

              <p className="font-bold">
                Thank You!
              </p>

              <p className="mt-1 text-sm">
                Thank you for your business.
              </p>

              <p className="mt-5 text-xs">
                Generated by ShanBizFlow
              </p>

            </div>

          </div>
        </div>
      )}
    </>
  );
}