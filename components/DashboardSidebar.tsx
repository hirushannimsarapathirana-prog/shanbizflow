"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
};

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "▦",
  },
  {
    name: "Products",
    href: "/products",
    icon: "📦",
  },
  {
    name: "Customers",
    href: "/customers",
    icon: "👥",
  },
  {
    name: "Sales",
    href: "/sales",
    icon: "💰",
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: "📊",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: "💳",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: "📈",
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
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
        console.error("Failed to load current user:", error);
        setUser(null);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    function handleOpenSidebar() {
      setMobileOpen(true);
    }

    function handleCloseSidebar() {
      setMobileOpen(false);
    }

    window.addEventListener("open-mobile-sidebar", handleOpenSidebar);
    window.addEventListener("close-mobile-sidebar", handleCloseSidebar);

    return () => {
      window.removeEventListener("open-mobile-sidebar", handleOpenSidebar);
      window.removeEventListener("close-mobile-sidebar", handleCloseSidebar);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sky-100 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-full flex-col px-5 py-6">

          <div className="mb-8 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">
              Main Menu
            </p>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                    isActive
                      ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm dark:bg-slate-800">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}

            {isSuperAdmin && (
              <Link
                href="/users"
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                  pathname === "/users"
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm dark:bg-slate-800">
                  👤
                </span>

                <span>Users</span>
              </Link>
            )}
          </nav>

          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>

            <Link
              href="/settings"
              className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                pathname === "/settings"
                  ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                ⚙️
              </span>

              <span>Settings</span>
            </Link>
          </div>

        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[min(85vw,20rem)] border-r border-sky-100 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden dark:border-slate-800 dark:bg-slate-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">

          {/* Mobile Header */}
          <div className="mb-6 flex items-center justify-between px-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                Main Menu
              </p>
            </div>

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={closeMobileSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                    isActive
                      ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm dark:bg-slate-800">
                    {item.icon}
                  </span>

                  <span>{item.name}</span>
                </Link>
              );
            })}

            {isSuperAdmin && (
              <Link
                href="/users"
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                  pathname === "/users"
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm dark:bg-slate-800">
                  👤
                </span>

                <span>Users</span>
              </Link>
            )}
          </nav>

          {/* Mobile System */}
          <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>

            <Link
              href="/settings"
              onClick={closeMobileSidebar}
              className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                pathname === "/settings"
                  ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                ⚙️
              </span>

              <span>Settings</span>
            </Link>
          </div>

        </div>
      </aside>
    </>
  );
}

