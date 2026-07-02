"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  if (!mounted) {
    return (
      <button className="flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface hover:bg-primary/10 rounded-lg transition-all scale-95 active:scale-90 duration-200" aria-label="Toggle theme">
        <span className="material-symbols-outlined">dark_mode</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 text-on-surface-variant hover:text-on-surface hover:bg-primary/10 rounded-lg transition-all scale-95 active:scale-90 duration-200"
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span className="material-symbols-outlined">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
