"use client";

import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {localeConfig, supportedLocales, type Locale} from "@/i18n/locales";

export default function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const changeLocale = (nextLocale: Locale) => {
    if (locale !== nextLocale) router.replace(pathname, {locale: nextLocale});
  };

  return (
    <div className="flex items-center gap-1 font-mono text-xs font-semibold tracking-wider" aria-label="Language">
      {supportedLocales.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 && <span aria-hidden="true" className="text-outline-variant/60">/</span>}
          <button type="button" onClick={() => changeLocale(code)} title={localeConfig[code].label} className={`rounded px-1.5 py-1 transition hover:bg-primary/10 ${locale === code ? "font-bold text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>{localeConfig[code].shortLabel}</button>
        </span>
      ))}
    </div>
  );
}
