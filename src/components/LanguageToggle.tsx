"use client";

import {useEffect, useRef, useState} from "react";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {supportedLocales, type Locale} from "@/i18n/locales";

const labels: Record<Locale, {short: string; name: string}> = {
  en: {short: "EN", name: "English"},
  vi: {short: "VI", name: "Tieng Viet"},
};

export default function LanguageToggle() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const changeLocale = (nextLocale: Locale) => {
    setOpen(false);
    if (locale !== nextLocale) router.replace(pathname, {locale: nextLocale});
  };

  const current = labels[locale] ?? labels.vi;

  return (
    <div ref={rootRef} className="relative" aria-label="Language selector">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-2.5 text-on-surface-variant shadow-sm transition active:scale-95 ${open ? "border-primary/50 bg-primary/10 text-primary" : "border-outline-variant/45 bg-surface-container-low hover:border-primary/40 hover:bg-primary/10 hover:text-on-surface"}`}
        title="Change language"
      >
        <span className="material-symbols-outlined text-[21px]">language</span>
        <span className="hidden font-mono text-xs font-bold tracking-wider sm:inline">{current.short}</span>
        <span className={`material-symbols-outlined hidden text-[17px] transition sm:inline ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-[70] min-w-40 overflow-hidden rounded-xl border border-outline-variant/45 bg-surface-container-lowest p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
        >
          {supportedLocales.map((code) => {
            const option = labels[code] ?? {short: code.toUpperCase(), name: code};
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => changeLocale(code)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-primary/12 text-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-container-high font-mono text-[11px] font-bold">{option.short}</span>
                  <span className="font-medium">{option.name}</span>
                </span>
                {active && <span className="material-symbols-outlined text-[18px]">check</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
