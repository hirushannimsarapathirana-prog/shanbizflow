"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  async function checkAuthentication() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        setUser(null);
        return;
      }

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.authenticated === true && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    checkAuthentication();
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Logout failed:", response.status);
        return;
      }

      setUser(null);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="border-b border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

        {/* Logo */}
        <div>
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tight text-sky-600">
              ShanBizFlow
            </h1>
          </Link>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Business Management
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6">

          <Link
            href="/"
            className="font-medium text-slate-700 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
          >
            Home
          </Link>

          <Link
            href="/about"
            className="font-medium text-slate-700 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
          >
            About
          </Link>

          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          ) : user !== null ? (
            <>
              <Link
                href="/dashboard"
                className="font-medium text-slate-700 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
              >
                Dashboard
              </Link>

              <span className="font-medium text-slate-600 dark:text-slate-300">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full bg-red-500 px-6 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-slate-700 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-sky-500 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-600"
              >
                Get Started
              </Link>
            </>
          )}

        </div>
      </div>
    </nav>
  );
}

