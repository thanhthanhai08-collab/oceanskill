"use client";

import {useLayoutEffect, useState} from "react";
import {useLocale} from "next-intl";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const locale = useLocale();
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);
    const frame = window.requestAnimationFrame(() => {
      setTheme(preferredTheme);
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [locale]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
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
