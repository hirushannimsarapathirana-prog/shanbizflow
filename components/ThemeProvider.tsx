"use client";

import { useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export default function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";

    setDarkMode(isDark);
    setMounted(true);

    document.documentElement.classList.toggle(
      "dark",
      isDark
    );
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode, mounted]);

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const customEvent =
        event as CustomEvent<{
          darkMode: boolean;
        }>;

      setDarkMode(customEvent.detail.darkMode);
    }

    window.addEventListener(
      "theme-change",
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        "theme-change",
        handleThemeChange
      );
    };
  }, []);

  return <>{children}</>;
}