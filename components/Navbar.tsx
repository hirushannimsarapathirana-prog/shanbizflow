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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
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
      setMobileMenuOpen(false);

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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">

        {/* Logo */}
        <div className="min-w-0">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <h1 className="truncate text-xl font-bold tracking-tight text-sky-600 sm:text-2xl">
              ShanBizFlow
            </h1>
          </Link>

          <p className="truncate text-[11px] text-slate-400 sm:text-xs dark:text-slate-500">
            Business Management
          </p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-6">

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

              <span className="max-w-40 truncate font-medium text-slate-600 dark:text-slate-300">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="whitespace-nowrap rounded-full bg-red-500 px-6 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="whitespace-nowrap rounded-full bg-sky-500 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-600"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-white text-slate-700 transition hover:bg-sky-50 lg:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {mobileMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-sky-100 bg-white px-4 py-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">

            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            >
              Home
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            >
              About
            </Link>

            {loading ? (
              <div className="my-2 h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            ) : user !== null ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                >
                  Dashboard
                </Link>

                <div className="rounded-lg bg-sky-50 px-4 py-3 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {user.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-full bg-sky-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-sky-600"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </div>
      )}
    </nav>
  );
}
