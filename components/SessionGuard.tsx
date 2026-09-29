"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname === "/login" ||
      pathname === "/register"
    ) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    async function setupSessionTimer() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login?session=expired");
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!data.authenticated) {
          router.replace("/login?session=expired");
          return;
        }

        timer = setTimeout(
          () => {
            router.replace("/login?session=expired");
          },
          30 * 60 * 1000
        );
      } catch (error) {

        console.warn(
          "Unable to verify session:",
          error
        );
      }
    }

    setupSessionTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [pathname, router]);

  return null;
}