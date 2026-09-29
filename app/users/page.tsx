"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import { useEffect, useMemo, useState } from "react";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "STAFF";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

const roles: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-900/30 sm:text-base";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as UserRole,
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load users"
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value)
    );
  }, [users, search]);

  function openCreateModal() {
    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "STAFF",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error("Name is required");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required");
      }

      if (
        !editingUser &&
        form.password.length < 6
      ) {
        throw new Error(
          "Password must be at least 6 characters"
        );
      }

      if (editingUser) {
        const response = await fetch(
          `/api/users/${editingUser.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              role: form.role,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to update user"
          );
        }

        setSuccess(
          "User updated successfully"
        );
      } else {
        const response = await fetch(
          "/api/users",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to create user"
          );
        }

        setSuccess(
          "User created successfully"
        );
      }

      await loadUsers();

      setTimeout(() => {
        setShowModal(false);
        setEditingUser(null);
        setSuccess("");
      }, 700);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/users/${user.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete user"
        );
      }

      setSuccess(
        "User deleted successfully"
      );

      await loadUsers();

      setTimeout(() => {
        setSuccess("");
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete user"
      );
    }
  }

  function getRoleStyle(role: UserRole) {
    if (role === "SUPER_ADMIN") {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    }

    if (role === "ADMIN") {
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    }

    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:ml-64 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl min-w-0">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-5 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold text-sky-600 sm:text-sm">
                System Management
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Users
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Manage system users and their access roles.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="w-full shrink-0 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto"
            >
              + Add User
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-5 break-words rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium leading-5 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300 sm:mb-6">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-5 break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 sm:mb-6">
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="mb-5 grid gap-4 sm:mb-6 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Users
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {users.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Administrators
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {
                  users.filter(
                    (user) =>
                      user.role === "ADMIN"
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Staff
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {
                  users.filter(
                    (user) =>
                      user.role === "STAFF"
                  ).length
                }
              </p>
            </div>

          </div>

          {/* Users Table */}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className={inputClass}
              />
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500 sm:p-12 sm:text-base">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center sm:p-12">

                <div className="text-4xl">
                  👥
                </div>

                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  No users found
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  Try another search or create a new user.
                </p>

              </div>
            ) : (
              <div className="w-full overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950">

                      <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        User
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Email
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Role
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Created
                      </th>

                      <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                      >

                        <td className="px-5 py-5 sm:px-6">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                              {user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate font-semibold text-slate-900 dark:text-white">
                                {user.name}
                              </p>

                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                #{user.id}
                              </p>
                            </div>

                          </div>
                        </td>

                        <td className="max-w-[240px] truncate px-5 py-5 text-sm text-slate-600 dark:text-slate-300 sm:px-6">
                          {user.email}
                        </td>

                        <td className="px-5 py-5 sm:px-6">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getRoleStyle(
                              user.role
                            )}`}
                          >
                            {user.role.replace("_", " ")}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-500 dark:text-slate-400 sm:px-6">
                          {new Date(
                            user.createdAt
                          ).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-5 sm:px-6">
                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openEditModal(user)
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(user)
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                            >
                              Delete
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

          <div className="my-4 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:my-8 sm:p-6">

            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {editingUser
                    ? "Update user details and access role."
                    : "Create a new ShanBizFlow user."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="shrink-0 text-2xl leading-none text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="user@example.com"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Minimum 6 characters"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Password must contain at least 6 characters.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as UserRole,
                    })
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  {roles.map((role) => (
                    <option
                      key={role}
                      value={role}
                      className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                    >
                      {role.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

