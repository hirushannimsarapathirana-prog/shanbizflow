"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

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

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchInventory() {
    try {
      setLoading(true);

      const response = await fetch("/api/inventory", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch inventory"
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
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch history"
        );
      }

      setMovements(data);
    } catch (error) {
      console.error("Fetch history error:", error);
    }
  }

  useEffect(() => {
    fetchInventory();
    fetchHistory();
  }, []);

  async function handleInventoryUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!productId) {
      setError("Please select a product");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(productId),
          type,
          quantity: qty,
          reason: reason.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update inventory"
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

  const filteredProducts = products.filter(
    (product) => {
      const searchText = search.toLowerCase();

      return (
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.category
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) =>
      total + product.stock,
    0
  );

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 5
  );

  const outOfStockProducts = products.filter(
    (product) => product.stock === 0
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 px-6 py-10">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Inventory Management
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              Inventory
            </h1>

            <p className="mt-2 text-slate-500">
              Manage stock levels, stock movements and inventory history.
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
                Total Products
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900">
                {totalProducts}
              </p>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-sky-600">
                {totalStock}
              </p>
            </div>

            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Low Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-orange-500">
                {lowStockProducts.length}
              </p>
            </div>

            <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Out of Stock
              </p>

              <p className="mt-3 text-3xl font-extrabold text-red-500">
                {outOfStockProducts.length}
              </p>
            </div>

          </div>

          <section className="mb-10 rounded-3xl border border-sky-100 bg-white p-7 shadow-sm">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Update Inventory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add stock, remove stock or adjust the current stock level.
              </p>
            </div>

            <form
              onSubmit={handleInventoryUpdate}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Product
                </label>

                <select
                  value={productId}
                  onChange={(event) =>
                    setProductId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} — Stock: {product.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Movement Type
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
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

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reason
                </label>

                <input
                  type="text"
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  placeholder="Optional reason"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />
              </div>

              <div className="md:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-500 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Updating..."
                    : "Update Inventory"}
                </button>
              </div>

            </form>
          </section>

          <section className="mb-10">

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Current Stock
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View the current stock level of every product.
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 md:w-80"
              />

            </div>

            {loading ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-sm">
                <p className="text-slate-500">
                  Loading inventory...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-sky-100 bg-white p-12 text-center shadow-sm">
                <div className="text-5xl">
                  📦
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  No products found
                </h3>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

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
                        className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >

                        <div className="flex h-52 items-center justify-center bg-slate-50 p-4">

                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="text-6xl">
                              📦
                            </div>
                          )}

                        </div>

                        <div className="p-6">

                          <div className="flex items-start justify-between gap-3">

                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {product.name}
                              </h3>

                              {product.category && (
                                <p className="mt-1 text-sm text-slate-400">
                                  {product.category}
                                </p>
                              )}
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                outOfStock
                                  ? "bg-red-50 text-red-600"
                                  : lowStock
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-green-50 text-green-600"
                              }`}
                            >
                              {outOfStock
                                ? "Out of Stock"
                                : lowStock
                                  ? "Low Stock"
                                  : "In Stock"}
                            </span>

                          </div>

                          <div className="mt-6 flex items-end justify-between">

                            <div>
                              <p className="text-sm text-slate-400">
                                Available Stock
                              </p>

                              <p
                                className={`mt-1 text-4xl font-extrabold ${
                                  outOfStock
                                    ? "text-red-500"
                                    : lowStock
                                      ? "text-orange-500"
                                      : "text-sky-600"
                                }`}
                              >
                                {product.stock}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm text-slate-400">
                                Price
                              </p>

                              <p className="mt-1 font-bold text-slate-900">
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

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Stock History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track every inventory movement.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">

              {movements.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl">
                    📋
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    No stock movements yet
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Inventory activity will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[800px]">

                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Date
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Product
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Type
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Quantity
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Previous
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          New Stock
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Reason
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {movements.map(
                        (movement) => (
                          <tr
                            key={movement.id}
                            className="transition hover:bg-slate-50"
                          >

                            <td className="px-6 py-4 text-sm text-slate-600">
                              {new Date(
                                movement.createdAt
                              ).toLocaleString()}
                            </td>

                            <td className="px-6 py-4 font-semibold text-slate-900">
                              {movement.product.name}
                            </td>

                            <td className="px-6 py-4">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  movement.type ===
                                  "STOCK_IN"
                                    ? "bg-green-50 text-green-600"
                                    : movement.type ===
                                        "STOCK_OUT"
                                      ? "bg-red-50 text-red-600"
                                      : "bg-orange-50 text-orange-600"
                                }`}
                              >
                                {movement.type.replace(
                                  "_",
                                  " "
                                )}
                              </span>

                            </td>

                            <td className="px-6 py-4 font-bold text-slate-900">
                              {movement.quantity}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {movement.previousStock}
                            </td>

                            <td className="px-6 py-4 font-bold text-sky-600">
                              {movement.newStock}
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              {movement.reason || "-"}
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

        </div>
      </main>
    </div>
  );
}
