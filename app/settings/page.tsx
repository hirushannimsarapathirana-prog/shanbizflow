"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadUser();

    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";

    setDarkMode(isDark);

    document.documentElement.classList.toggle(
      "dark",
      isDark
    );
  }, []);

  async function loadUser() {
    try {
      setLoading(true);

      const response = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load profile"
        );
      }

      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
    } catch (error) {
      console.error("Load profile error:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError("Name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setProfileError(
        "Name must be at least 2 characters."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setProfileError(
        "Name cannot exceed 100 characters."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(
          data.error || "Failed to update profile."
        );
        return;
      }

      setUser(data.user);
      setName(data.user.name);

      setProfileMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileError(
        "Something went wrong while updating your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill all password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword.length > 100) {
      setPasswordError(
        "New password cannot exceed 100 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        "/api/users/me/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(
          data.error ||
            "Failed to change password."
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully."
      );
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      setPasswordError(
        "Something went wrong while changing your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  function toggleDarkMode() {
    const nextValue = !darkMode;

    setDarkMode(nextValue);

    document.documentElement.classList.toggle(
      "dark",
      nextValue
    );

    localStorage.setItem(
      "theme",
      nextValue ? "dark" : "light"
    );

    window.dispatchEvent(
      new CustomEvent("theme-change", {
        detail: {
          darkMode: nextValue,
        },
      })
    );
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />

        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-5xl animate-pulse">
            <div className="h-10 w-48 rounded bg-slate-200 dark:bg-slate-800" />

            <div className="mt-3 h-5 w-80 rounded bg-slate-200 dark:bg-slate-800" />

            <div className="mt-8 h-64 rounded-2xl bg-white dark:bg-slate-900" />

            <div className="mt-6 h-80 rounded-2xl bg-white dark:bg-slate-900" />

            <div className="mt-6 h-64 rounded-2xl bg-white dark:bg-slate-900" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">
              Account & System
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Manage your profile, security and application preferences.
            </p>
          </div>

          {/* Profile */}
          <section className="mt-8 rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-xl font-bold text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                  {name
                    ? name.charAt(0).toUpperCase()
                    : "U"}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Profile Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Update your personal account information.
                  </p>
                </div>

              </div>
            </div>

            <form
              onSubmit={updateProfile}
              className="p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Email cannot be changed here.
                  </p>
                </div>

              </div>

              {profileError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {profileMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-6 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProfile
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Security */}
          <section className="mt-6 rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                  🔐
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Keep your account password secure.
                  </p>
                </div>

              </div>
            </div>

            <form
              onSubmit={changePassword}
              className="p-6"
            >
              <div className="grid gap-5 md:grid-cols-3">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Current password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="New password"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Minimum 6 characters.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Confirm password"
                  />
                </div>

              </div>

              {passwordError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {passwordMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {changingPassword
                  ? "Changing..."
                  : "Change Password"}
              </button>
            </form>
          </section>

          {/* Preferences */}
          <section className="mt-6 rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Customize your ShanBizFlow experience.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">

              {/* Dark Mode */}
              <div className="flex items-center justify-between gap-5 p-6">

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-xl dark:bg-sky-950">
                    {darkMode ? "🌙" : "☀️"}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Dark Mode
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Use a darker appearance throughout ShanBizFlow.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                  aria-pressed={darkMode}
                  className={`relative h-7 w-12 rounded-full transition ${
                    darkMode
                      ? "bg-sky-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      darkMode
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

            </div>
          </section>

          {/* Account Information */}
          <section className="mt-6 rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Information about your ShanBizFlow account.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-3">

              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  User ID
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  #{user?.id}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Role
                </p>

                <p className="mt-2 text-lg font-bold text-sky-600 dark:text-sky-400">
                  {user?.role}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Account Status
                </p>

                <p className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  Active
                </p>
              </div>

            </div>
          </section>

          {/* Session */}
          <section className="mt-6 rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Session
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your session automatically expires after 30 minutes.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950">
                  🛡️
                </div>

                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Current session
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Your authentication session is active.
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>

            </div>
          </section>

          <div className="mb-10 mt-8 text-center">
            <p className="text-xs text-slate-400">
              ShanBizFlow • Business Management System
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}