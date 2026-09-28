"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="hidden min-h-screen w-64 border-r border-sky-100 bg-white lg:block">
      <div className="sticky top-0 min-h-screen p-5">

        <div className="mb-8 px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-500">
            Main Menu
          </p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                  isActive
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm">
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 border-t border-slate-100 pt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            System
          </p>

          <Link
            href="/settings"
            className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
              ⚙️
            </span>

            <span>Settings</span>
          </Link>
        </div>

      </div>
    </aside>
  );
}