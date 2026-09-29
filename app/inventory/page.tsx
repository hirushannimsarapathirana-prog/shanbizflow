"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
};

type StockMovement = {
  id: number;
  productId: number;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
  };
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [productId, setProductId] = useState("");
  const [type, setType] = useState("STOCK_IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  const [userRole, setUserRole] =
    useState<UserRole | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canUpdateInventory =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  async function loadUser() {
    try {
      setUserLoading(true);

      const response = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setUserRole(null);
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
        setUserRole(data.user.role);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error(
        "Load user error:",
        error
      );

      setUserRole(null);
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchInventory() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/inventory",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to view inventory."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch inventory"
        );
      }

      setProducts(data);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(
        "/api/inventory/history",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to view stock history."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to fetch history"
        );
      }

      setMovements(data);
    } catch (error) {
      console.error(
        "Fetch history error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load stock history"
      );
    }
  }

  useEffect(() => {
    loadUser();
    fetchInventory();
    fetchHistory();
  }, []);

  async function handleInventoryUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!canUpdateInventory) {
      setError(
        "You do not have permission to update inventory."
      );
      return;
    }

    if (!productId) {
      setError("Please select a product");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError(
        "Quantity must be greater than 0"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/inventory",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            productId: Number(productId),
            type,
            quantity: qty,
            reason:
              reason.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "You do not have permission to update inventory."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update inventory"
        );
      }

      setMessage(
        "Inventory updated successfully"
      );

      setProductId("");
      setType("STOCK_IN");
      setQuantity("");
      setReason("");

      await fetchInventory();
      await fetchHistory();
    } catch (error) {
      console.error(
        "Inventory update error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update inventory"
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts =
    products.filter((product) => {
      const searchText =
        search.toLowerCase().trim();

      return (
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.category
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (total, product) =>
        total + product.stock,
      0
    );

  const lowStockProducts =
    products.filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= 5
    );

  const outOfStockProducts =
    products.filter(
      (product) =>
        product.stock === 0
    );

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 sm:text-base dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-950";

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">

      <DashboardSidebar />

      <main className="min-w-0 lg:ml-64">

        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

          <div className="mb-7 sm:mb-10">

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-wider text-sky-500 sm:text-sm">
                  Inventory Management
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Inventory
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
                  Manage stock levels, stock movements and inventory history.
                </p>

              </div>

              {!userLoading && userRole && (
                <span className="w-fit shrink-0 rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 sm:px-4 sm:text-sm dark:bg-sky-950 dark:text-sky-300">
                  {userRole.replace(
                    "_",
                    " "
                  )}
                </span>
              )}

            </div>

          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 sm:mb-6 sm:px-5 sm:py-4 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mb-6 sm:px-5 sm:py-4 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-4 sm:gap-5 md:grid-cols-2 xl:mb-10 xl:grid-cols-4">

            <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Products
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalProducts}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-sky-600">
                {totalStock}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Low Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-orange-500">
                {lowStockProducts.length}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Out of Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-red-500">
                {outOfStockProducts.length}
              </p>
            </div>

          </div>

          {!userLoading && canUpdateInventory && (
            <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:mb-10 sm:rounded-3xl sm:p-6 lg:p-7 dark:border-slate-800 dark:bg-slate-900">

              <div className="mb-5 sm:mb-6">

                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  Update Inventory
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Add stock, remove stock or adjust the current stock level.
                </p>

              </div>

              <form
                onSubmit={handleInventoryUpdate}
                className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4"
              >

                <div className="min-w-0">

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
                    className={inputClass}
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name} — Stock:{" "}
                          {product.stock}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="min-w-0">

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Movement Type
                  </label>

                  <select
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="STOCK_IN">
                      Stock In
                    </option>

                    <option value="STOCK_OUT">
                      Stock Out
                    </option>

                    <option value="ADJUSTMENT">
                      Adjustment
                    </option>
                  </select>

                </div>

                <div className="min-w-0">

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value
                      )
                    }
                    placeholder="Enter quantity"
                    className={inputClass}
                  />

                </div>

                <div className="min-w-0">

                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Reason
                  </label>

                  <input
                    type="text"
                    value={reason}
                    onChange={(event) =>
                      setReason(
                        event.target.value
                      )
                    }
                    placeholder="Optional reason"
                    className={inputClass}
                  />

                </div>

                <div className="md:col-span-2 xl:col-span-4">

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-7"
                  >
                    {saving
                      ? "Updating..."
                      : "Update Inventory"}
                  </button>

                </div>

              </form>

            </section>
          )}

          {!userLoading && userRole === "STAFF" && (
            <div className="mb-8 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 sm:mb-10 sm:px-5 dark:border-sky-900 dark:bg-sky-950">
              <p className="text-sm leading-6 font-medium text-sky-700 dark:text-sky-300">
                You have view-only access to inventory. Stock changes can only be performed by administrators.
              </p>
            </div>
          )}

          <section className="mb-8 sm:mb-10">

            <div className="mb-5 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">

              <div className="min-w-0">

                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  Current Stock
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  View the current stock level of every product.
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
                placeholder="Search products..."
                className={`${inputClass} md:w-80`}
              />

            </div>

            {loading ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12 dark:border-slate-800 dark:bg-slate-900">

                <p className="text-sm font-medium text-slate-500 sm:text-base dark:text-slate-400">
                  Loading inventory...
                </p>

              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12 dark:border-slate-800 dark:bg-slate-900">

                <div className="text-5xl">
                  📦
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                  No products found
                </h3>

              </div>
            ) : (
              <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">

                {filteredProducts.map(
                  (product) => {

                    const lowStock =
                      product.stock > 0 &&
                      product.stock <= 5;

                    const outOfStock =
                      product.stock === 0;

                    return (
                      <div
                        key={product.id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
                      >

                        <div className="flex h-44 items-center justify-center bg-slate-50 p-4 sm:h-52 dark:bg-slate-800">

                          {product.imageUrl ? (
                            <img
                              src={
                                product.imageUrl
                              }
                              alt={
                                product.name
                              }
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="text-5xl sm:text-6xl">
                              📦
                            </div>
                          )}

                        </div>

                        <div className="min-w-0 p-5 sm:p-6">

                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

                              <h3 className="break-words text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                                {product.name}
                              </h3>

                              {product.category && (
                                <p className="mt-1 break-words text-sm text-slate-400">
                                  {
                                    product.category
                                  }
                                </p>
                              )}

                            </div>

                            <span
                              className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                                outOfStock
                                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                                  : lowStock
                                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
                                    : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                              }`}
                            >
                              {outOfStock
                                ? "Out of Stock"
                                : lowStock
                                  ? "Low Stock"
                                  : "In Stock"}
                            </span>

                          </div>

                          <div className="mt-5 flex flex-col gap-5 sm:mt-6 sm:flex-row sm:items-end sm:justify-between">

                            <div>

                              <p className="text-sm text-slate-400">
                                Available Stock
                              </p>

                              <p
                                className={`mt-1 text-3xl font-extrabold sm:text-4xl ${
                                  outOfStock
                                    ? "text-red-500"
                                    : lowStock
                                      ? "text-orange-500"
                                      : "text-sky-600"
                                }`}
                              >
                                {
                                  product.stock
                                }
                              </p>

                            </div>

                            <div className="text-left sm:text-right">

                              <p className="text-sm text-slate-400">
                                Price
                              </p>

                              <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                Rs.{" "}
                                {product.price.toLocaleString()}
                              </p>

                            </div>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          <section>

            <div className="mb-5 sm:mb-6">

              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                Stock History
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Track every inventory movement.
              </p>

            </div>

            <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900">

              {movements.length === 0 ? (
                <div className="p-8 text-center sm:p-12">

                  <div className="text-5xl">
                    📋
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                    No stock movements yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Inventory activity will appear here.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[800px]">

                    <thead className="bg-slate-50 dark:bg-slate-800">

                      <tr>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Date
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Product
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Type
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Quantity
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Previous
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          New Stock
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6 dark:text-slate-400">
                          Reason
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                      {movements.map(
                        (movement) => (
                          <tr
                            key={
                              movement.id
                            }
                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800"
                          >

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6 dark:text-slate-300">
                              {new Date(
                                movement.createdAt
                              ).toLocaleString()}
                            </td>

                            <td className="max-w-[220px] px-5 py-4 font-semibold text-slate-900 sm:px-6 dark:text-white">
                              <span className="block truncate">
                                {
                                  movement
                                    .product
                                    .name
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 sm:px-6">

                              <span
                                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                                  movement.type ===
                                  "STOCK_IN"
                                    ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                                    : movement.type ===
                                        "STOCK_OUT"
                                      ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                                      : "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
                                }`}
                              >
                                {movement.type.replace(
                                  "_",
                                  " "
                                )}
                              </span>

                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900 sm:px-6 dark:text-white">
                              {
                                movement.quantity
                              }
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600 sm:px-6 dark:text-slate-300">
                              {
                                movement.previousStock
                              }
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-bold text-sky-600 sm:px-6">
                              {
                                movement.newStock
                              }
                            </td>

                            <td className="max-w-[220px] px-5 py-4 text-slate-500 sm:px-6 dark:text-slate-400">
                              <span className="block truncate">
                                {
                                  movement.reason ||
                                  "-"
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

            </div>

          </section>

          <div className="mb-8 mt-8 text-center">

            <p className="text-xs text-slate-400">
              ShanBizFlow • Inventory Management
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

