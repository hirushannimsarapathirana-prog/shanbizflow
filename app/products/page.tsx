"use client";

import { ChangeEvent, useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
};

type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canManageProducts =
    userRole === "SUPER_ADMIN" || userRole === "ADMIN";

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

  async function loadProducts() {
    try {
      setLoading(true);

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error || "Failed to load products"
        );
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error("Load products error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUser();
    loadProducts();
  }, []);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setCategory("");
    setImageFile(null);
    setImagePreview("");
    setEditingProduct(null);
  }

  function startEdit(product: Product) {
    if (!canManageProducts) {
      setError("You do not have permission to edit products.");
      return;
    }

    setEditingProduct(product);

    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setStock(String(product.stock));
    setCategory(product.category || "");

    setImageFile(null);
    setImagePreview(product.imageUrl || "");

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) {
      return editingProduct?.imageUrl || null;
    }

    const formData = new FormData();

    formData.append("file", imageFile);

    const response = await fetch(
      "/api/uploads/product-image",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to upload image."
      );
    }

    return data.imageUrl;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!canManageProducts) {
      setError(
        "You do not have permission to manage products."
      );
      return;
    }

    if (!name.trim()) {
      setError("Please enter product name.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (stock && Number(stock) < 0) {
      setError("Stock cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImageUrl = await uploadImage();

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          stock: Number(stock || 0),
          category: category.trim(),
          imageUrl: uploadedImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            `Failed to ${
              editingProduct ? "update" : "create"
            } product.`
        );
        return;
      }

      setMessage(
        editingProduct
          ? "Product updated successfully."
          : "Product created successfully."
      );

      resetForm();

      await loadProducts();
    } catch (error) {
      console.error("Save product error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: number) {
    if (!canManageProducts) {
      setError(
        "You do not have permission to delete products."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(productId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Failed to delete product."
        );
        return;
      }

      setMessage("Product deleted successfully.");

      if (editingProduct?.id === productId) {
        resetForm();
      }

      await loadProducts();
    } catch (error) {
      console.error("Delete product error:", error);

      setError("Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  }

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter(
          (category): category is string =>
            Boolean(category)
        )
    )
  );

  const filteredProducts = products.filter((product) => {
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      product.name.toLowerCase().includes(searchValue) ||
      product.category?.toLowerCase().includes(searchValue) ||
      product.description?.toLowerCase().includes(searchValue);

    const matchesCategory =
      categoryFilter === "ALL" ||
      product.category === categoryFilter;

    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "IN_STOCK" && product.stock > 5) ||
      (stockFilter === "LOW_STOCK" &&
        product.stock > 0 &&
        product.stock <= 5) ||
      (stockFilter === "OUT_OF_STOCK" &&
        product.stock === 0);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStock
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 px-6 py-10 lg:ml-64">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-sky-500">
                  Product Management
                </p>

                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Products
                </h1>

                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Create, view, update and manage your products.
                </p>
              </div>

              {!userLoading && (
                <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400">
                  {userRole === "SUPER_ADMIN"
                    ? "SUPER ADMIN"
                    : userRole === "ADMIN"
                      ? "ADMIN"
                      : "STAFF"}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 px-5 py-4 text-sm font-medium text-green-600 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
              {message}
            </div>
          )}

          {userLoading ? (
            <div className="rounded-2xl border border-sky-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-slate-500 dark:text-slate-400">
                Loading permissions...
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">

              {canManageProducts && (
                <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  <div className="flex items-center justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingProduct
                          ? "Edit Product"
                          : "Add Product"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {editingProduct
                          ? "Update product information"
                          : "Create a new product"}
                      </p>
                    </div>

                    {editingProduct && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                  >

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Product Name
                      </label>

                      <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        placeholder="Enter product name"
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Description
                      </label>

                      <textarea
                        value={description}
                        onChange={(event) =>
                          setDescription(event.target.value)
                        }
                        placeholder="Product description"
                        rows={3}
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Price
                      </label>

                      <input
                        type="number"
                        value={price}
                        onChange={(event) =>
                          setPrice(event.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Stock
                      </label>

                      <input
                        type="number"
                        value={stock}
                        onChange={(event) =>
                          setStock(event.target.value)
                        }
                        placeholder="0"
                        min="0"
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Category
                      </label>

                      <input
                        type="text"
                        value={category}
                        onChange={(event) =>
                          setCategory(event.target.value)
                        }
                        placeholder="Electronics"
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Product Image
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          Optional
                        </span>
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-600 hover:file:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:file:bg-slate-700 dark:file:text-sky-400"
                      />

                      {imagePreview && (
                        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 dark:border-slate-700 dark:bg-slate-800">

                          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Image Preview
                          </p>

                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="h-40 w-full rounded-xl object-cover shadow-sm"
                          />

                          <button
                            type="button"
                            onClick={removeImage}
                            className="mt-3 text-sm font-semibold text-red-500 hover:text-red-600"
                          >
                            Remove Image
                          </button>

                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? editingProduct
                          ? "Updating..."
                          : "Creating..."
                        : editingProduct
                          ? "Update Product"
                          : "Add Product"}
                    </button>

                  </form>
                </div>
              )}

              <div
                className={
                  canManageProducts
                    ? "lg:col-span-2"
                    : "lg:col-span-3"
                }
              >

                <div className="rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  <div className="border-b border-slate-100 p-6 dark:border-slate-800">

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          Product List
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {filteredProducts.length} of{" "}
                          {products.length} products
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">

                        <input
                          type="text"
                          value={search}
                          onChange={(event) =>
                            setSearch(event.target.value)
                          }
                          placeholder="Search products..."
                          className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
                        />

                        <select
                          value={categoryFilter}
                          onChange={(event) =>
                            setCategoryFilter(event.target.value)
                          }
                          className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option
                            value="ALL"
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            All Categories
                          </option>

                          {categories.map((item) => (
                            <option
                              key={item}
                              value={item}
                              className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                            >
                              {item}
                            </option>
                          ))}
                        </select>

                        <select
                          value={stockFilter}
                          onChange={(event) =>
                            setStockFilter(event.target.value)
                          }
                          className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          <option
                            value="ALL"
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            All Stock
                          </option>

                          <option
                            value="IN_STOCK"
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            In Stock
                          </option>

                          <option
                            value="LOW_STOCK"
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            Low Stock
                          </option>

                          <option
                            value="OUT_OF_STOCK"
                            className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          >
                            Out of Stock
                          </option>
                        </select>

                      </div>

                    </div>

                  </div>

                  {loading ? (
                    <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                      Loading products...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-10 text-center">

                      <div className="text-4xl">
                        📦
                      </div>

                      <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
                        No products found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Try changing your search or filters.
                      </p>

                    </div>
                  ) : (
                    <div className="overflow-x-auto">

                      <table className="w-full">

                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                              Product
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                              Category
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                              Price
                            </th>

                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                              Stock
                            </th>

                            {canManageProducts && (
                              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Actions
                              </th>
                            )}

                          </tr>
                        </thead>

                        <tbody>

                          {filteredProducts.map((product) => (
                            <tr
                              key={product.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-sky-50/40 dark:border-slate-800 dark:hover:bg-slate-800/40"
                            >

                              <td className="px-6 py-4">

                                <div className="flex items-center gap-3">

                                  {product.imageUrl ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedImage(
                                          product.imageUrl
                                        )
                                      }
                                      className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-sky-100 bg-sky-50 dark:border-slate-700 dark:bg-slate-800"
                                      title="View image"
                                    >

                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
                                      />

                                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                                        🔍
                                      </span>

                                    </button>
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl dark:bg-slate-800">
                                      📦
                                    </div>
                                  )}

                                  <div className="min-w-0">

                                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                                      {product.name}
                                    </p>

                                    <p className="text-sm text-slate-400">
                                      #{product.id}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {product.category || "Uncategorized"}
                              </td>

                              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                Rs.{" "}
                                {product.price.toLocaleString()}
                              </td>

                              <td className="px-6 py-4">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    product.stock === 0
                                      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                                      : product.stock <= 5
                                        ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400"
                                        : "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                                  }`}
                                >
                                  {product.stock} in stock
                                </span>

                              </td>

                              {canManageProducts && (
                                <td className="px-6 py-4">

                                  <div className="flex justify-end gap-2">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEdit(product)
                                      }
                                      className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-900/50"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(product.id)
                                      }
                                      disabled={
                                        deletingId === product.id
                                      }
                                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50"
                                    >
                                      {deletingId === product.id
                                        ? "Deleting..."
                                        : "Delete"}
                                    </button>

                                  </div>

                                </td>
                              )}

                            </tr>
                          ))}

                        </tbody>

                      </table>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setSelectedImage(null)}
        >

          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-700 shadow-lg transition hover:bg-slate-100"
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Product preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

          </div>

        </div>
      )}

    </div>
  );
}