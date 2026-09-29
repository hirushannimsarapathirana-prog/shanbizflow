"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/login",
  "/register",
];

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (PUBLIC_PATHS.includes(pathname)) {
        if (active) {
          setChecking(false);
        }

        return;
      }

      try {
        if (active) {
          setChecking(true);
        }

        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) {
            router.replace("/login");
          }

          return;
        }

        const data = await response.json();

        if (!data.authenticated || !data.user) {
          if (active) {
            router.replace("/login");
          }

          return;
        }

        if (active) {
          setChecking(false);
        }
      } catch (error) {
        console.error("Session verification failed:", error);

        if (active) {
          router.replace("/login");
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

