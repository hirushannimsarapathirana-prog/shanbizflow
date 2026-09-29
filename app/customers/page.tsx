"use client";

import { ChangeEvent, useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  imageUrl: string | null;
};

type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canDeleteCustomers =
    userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  async function fetchCurrentUser() {
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
      console.error("Fetch current user error:", error);
      setError("Failed to verify user permissions");
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      setLoading(true);

      const response = await fetch("/api/customers", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch customers"
        );
      }

      setCustomers(data);
    } catch (error) {
      console.error("Fetch customers error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchCustomers();
  }, []);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePhoneChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value;
    const numbersOnly = value.replace(/\D/g, "");

    if (numbersOnly.length <= 10) {
      setForm((previous) => ({
        ...previous,
        phone: numbersOnly,
      }));
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    setSelectedFile(null);
    setImagePreview(null);
  }

  function validateForm() {
    if (!form.name.trim()) {
      setError("Customer name is required");
      return false;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Phone number must contain exactly 10 digits");
      return false;
    }

    if (form.email.trim()) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address");
        return false;
      }
    }

    return true;
  }

  async function uploadImage() {
    if (!selectedFile) {
      return editingCustomer?.imageUrl || null;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(
      "/api/uploads/customer-image",
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to upload customer image"
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

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const imageUrl = await uploadImage();

      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone,
        address: form.address.trim() || null,
        imageUrl,
      };

      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";

      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save customer"
        );
      }

      setMessage(
        editingCustomer
          ? "Customer updated successfully"
          : "Customer added successfully"
      );

      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("Save customer error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);

    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      address: customer.address || "",
    });

    setSelectedFile(null);
    setImagePreview(customer.imageUrl);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id: number) {
    if (!canDeleteCustomers) {
      setError(
        "You do not have permission to delete customers."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/customers/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete customer"
        );
      }

      setMessage("Customer deleted successfully");

      fetchCustomers();
    } catch (error) {
      console.error("Delete customer error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete customer"
      );
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setSelectedFile(null);
    setImagePreview(null);
    setEditingCustomer(null);
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase().trim();

    return (
      customer.name.toLowerCase().includes(searchText) ||
      customer.email?.toLowerCase().includes(searchText) ||
      customer.phone.toLowerCase().includes(searchText) ||
      customer.address?.toLowerCase().includes(searchText)
    );
  });

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-900/30";

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />

        <main className="min-w-0 lg:ml-64">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-medium text-slate-500 dark:text-slate-400">
                Checking permissions...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-w-0 lg:ml-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">

          <div className="mb-7 sm:mb-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-500 sm:text-sm">
                  Customer Management
                </p>

                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Customers
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
                  Manage your customers and their contact
                  information.
                </p>
              </div>

              {userRole && (
                <div className="w-fit shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-600 sm:px-4 sm:text-sm dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400">
                  Role: {userRole.replace("_", " ")}
                </div>
              )}

            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 sm:mb-6 sm:px-5 sm:py-4 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mb-6 sm:px-5 sm:py-4 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:mb-10 sm:rounded-3xl sm:p-6 lg:p-7 dark:border-slate-800 dark:bg-slate-900">

            <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add customer details and profile photo.
                </p>
              </div>

              {editingCustomer && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:px-5 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel Edit
                </button>
              )}

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-7 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]"
            >

              <div className="mx-auto w-full max-w-[220px] lg:mx-0">

                <div className="aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Customer preview"
                      className="h-full w-full cursor-pointer object-contain p-2"
                      onClick={() =>
                        setSelectedImage(imagePreview)
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-center">
                      <div className="text-4xl sm:text-5xl">
                        👤
                      </div>

                      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        No photo
                      </p>
                    </div>
                  )}
                </div>

                <label className="mt-3 block cursor-pointer rounded-xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600 sm:mt-4 sm:px-5">
                  {imagePreview
                    ? "Change Photo"
                    : "Choose Photo"}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 sm:px-5 dark:border-red-900 dark:hover:bg-red-950/30"
                  >
                    Remove Photo
                  </button>
                )}

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400 sm:text-xs">
                  JPG, PNG or WEBP • Max 5MB
                </p>

              </div>

              <div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2">

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Customer Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Phone *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="0771234567"
                    maxLength={10}
                    inputMode="numeric"
                    className={inputClass}
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter exactly 10 digits
                  </p>
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="customer@example.com"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-7"
                  >
                    {saving
                      ? "Saving..."
                      : editingCustomer
                        ? "Update Customer"
                        : "Add Customer"}
                  </button>
                </div>

              </div>
            </form>
          </section>

          <section>

            <div className="mb-5 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  Customer List
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {customers.length} customer
                  {customers.length !== 1 ? "s" : ""}
                </p>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customers..."
                className={`${inputClass} w-full md:max-w-sm`}
              />

            </div>

            {loading ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-500 dark:text-slate-400">
                  Loading customers...
                </p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-2xl border border-sky-100 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12 dark:border-slate-800 dark:bg-slate-900">

                <div className="text-5xl">
                  👥
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                  No customers found
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Add your first customer using the form above.
                </p>

              </div>
            ) : (
              <div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">

                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="min-w-0 overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900"
                  >

                    <div className="aspect-[4/3] w-full bg-slate-50 p-3 sm:aspect-[16/10] dark:bg-slate-800">
                      {customer.imageUrl ? (
                        <img
                          src={customer.imageUrl}
                          alt={customer.name}
                          className="h-full w-full cursor-pointer rounded-xl object-contain"
                          onClick={() =>
                            setSelectedImage(
                              customer.imageUrl
                            )
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center">
                          <div className="text-5xl sm:text-6xl">
                            👤
                          </div>

                          <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                            No photo
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">

                      <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                        {customer.name}
                      </h3>

                      <div className="mt-3 space-y-2.5 text-sm sm:mt-4 sm:space-y-3">

                        <p className="flex min-w-0 items-start gap-2 text-slate-600 dark:text-slate-300">
                          <span className="shrink-0">
                            📱
                          </span>

                          <span className="break-all">
                            {customer.phone}
                          </span>
                        </p>

                        {customer.email && (
                          <p className="flex min-w-0 items-start gap-2 text-slate-600 dark:text-slate-300">
                            <span className="shrink-0">
                              📧
                            </span>

                            <span className="break-all">
                              {customer.email}
                            </span>
                          </p>
                        )}

                        {customer.address && (
                          <p className="flex min-w-0 items-start gap-2 text-slate-600 dark:text-slate-300">
                            <span className="shrink-0">
                              📍
                            </span>

                            <span className="break-words">
                              {customer.address}
                            </span>
                          </p>
                        )}

                      </div>

                      <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(customer)
                          }
                          className="w-full rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 sm:flex-1 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-950/70"
                        >
                          Edit
                        </button>

                        {canDeleteCustomers && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(customer.id)
                            }
                            className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-100 sm:flex-1 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            Delete
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/80 p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative flex max-h-[92vh] max-w-5xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <img
              src={selectedImage}
              alt="Customer"
              className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl sm:max-h-[90vh] sm:max-w-full sm:rounded-2xl"
            />

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900 shadow sm:right-3 sm:top-3 sm:h-10 sm:w-10"
            >
              ✕
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

