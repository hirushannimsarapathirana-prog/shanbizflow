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

const DASHBOARD_PATHS = [
  "/dashboard",
  "/products",
  "/customers",
  "/sales",
  "/inventory",
  "/payments",
  "/reports",
  "/users",
  "/settings",
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboardPage = DASHBOARD_PATHS.includes(pathname);

  async function checkAuthentication() {
    try {
      setLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.authenticated && data.user) {
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
    checkAuthentication();
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        console.error(
          "Logout failed:",
          data?.error || `HTTP ${response.status}`
        );

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

  function handleMobileButton() {
    if (isDashboardPage) {
      window.dispatchEvent(new Event("open-mobile-sidebar"));
      return;
    }

    setMobileMenuOpen((open) => !open);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <nav className="relative z-50 w-full border-b border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="min-w-0 shrink-0"
        >
          <div>
            <h1 className="truncate text-xl font-bold tracking-tight text-sky-600 sm:text-2xl">
              ShanBizFlow
            </h1>

            <p className="truncate text-[11px] text-slate-400 sm:text-xs dark:text-slate-500">
              Business Management
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-7">

          <Link
            href="/"
            className={`whitespace-nowrap font-medium transition ${
              pathname === "/"
                ? "text-sky-600 dark:text-sky-400"
                : "text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
            }`}
          >
            Home
          </Link>

          <Link
            href="/about"
            className={`whitespace-nowrap font-medium transition ${
              pathname === "/about"
                ? "text-sky-600 dark:text-sky-400"
                : "text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
            }`}
          >
            About
          </Link>

          {loading ? (
            <span className="text-sm text-slate-400">
              Loading...
            </span>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className={`whitespace-nowrap font-medium transition ${
                  pathname === "/dashboard"
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
                }`}
              >
                Dashboard
              </Link>

              <span className="max-w-[160px] truncate whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="whitespace-nowrap rounded-full bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`whitespace-nowrap font-medium transition ${
                  pathname === "/login"
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-slate-700 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
                }`}
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

        {/* Mobile Button */}
        <button
          type="button"
          onClick={handleMobileButton}
          aria-label={
            isDashboardPage
              ? "Open dashboard menu"
              : mobileMenuOpen
                ? "Close menu"
                : "Open menu"
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-white text-slate-700 transition hover:bg-sky-50 lg:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {mobileMenuOpen && !isDashboardPage ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Public Mobile Navigation */}
      {!isDashboardPage && mobileMenuOpen && (
        <div className="border-t border-sky-100 bg-white lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">

            <div className="flex flex-col gap-1">

              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`rounded-xl px-4 py-3 font-medium transition ${
                  pathname === "/"
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                    : "text-slate-700 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                }`}
              >
                Home
              </Link>

              <Link
                href="/about"
                onClick={closeMobileMenu}
                className={`rounded-xl px-4 py-3 font-medium transition ${
                  pathname === "/about"
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                    : "text-slate-700 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                }`}
              >
                About
              </Link>

              {loading ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  Loading...
                </div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                  >
                    Dashboard
                  </Link>

                  <div className="mt-1 rounded-xl bg-sky-50 px-4 py-3 dark:bg-slate-800">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
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
                    className="mt-1 w-full rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="mt-1 w-full rounded-full bg-sky-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-sky-600"
                  >
                    Get Started
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

