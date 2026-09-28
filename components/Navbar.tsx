"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    getCurrentUser();
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        setUser(null);
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="border-b border-sky-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div>
          <Link href="/">
            <h1 className="text-2xl font-bold tracking-tight text-sky-600">
              ShanBizFlow
            </h1>
          </Link>

          <p className="text-xs text-slate-400">
            Business Management
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-medium text-slate-700 transition hover:text-sky-600"
          >
            Home
          </Link>

          <Link
            href="/about"
            className="font-medium text-slate-700 transition hover:text-sky-600"
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
                className="font-medium text-slate-700 transition hover:text-sky-600"
              >
                Dashboard
              </Link>

              <span className="font-medium text-slate-600">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-200 px-5 py-2.5 font-semibold text-red-500 transition hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-slate-700 transition hover:text-sky-600"
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