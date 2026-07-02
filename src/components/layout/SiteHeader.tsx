import {getLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {createClient} from "@/lib/supabase/server";
import HeaderNav from "@/components/layout/HeaderNav";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

export interface SiteHeaderProps { readonly showSearch?: boolean; }

export default async function SiteHeader({showSearch = true}: SiteHeaderProps) {
  const [common, navigation, locale] = await Promise.all([getTranslations("Common"), getTranslations("Navigation"), getLocale()]);
  const supabase = await createClient();
  const {data} = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-geist text-xl font-bold tracking-tight text-primary" aria-label={navigation("homeLabel")}>
          {common("brand")}
        </Link>
        {showSearch && (
          <form action={`/${locale}/skills`} className="relative ml-3 hidden w-56 lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
            <input name="q" className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-9 py-2 text-sm outline-none transition focus:border-primary" placeholder={navigation("searchPlaceholder")} />
          </form>
        )}
        <div className="ml-auto flex items-center gap-1">
          <HeaderNav />
          <div className="mx-2 hidden h-5 w-px bg-outline-variant/40 sm:block" />
          <ThemeToggle />
          <div className="hidden sm:block"><LanguageToggle /></div>
          {signedIn ? (
            <Link href="/dashboard" className="ml-1 rounded-lg bg-primary-container px-4 py-2 font-mono text-xs font-semibold text-white transition hover:bg-inverse-primary">{common("dashboard")}</Link>
          ) : (
            <>
              <Link href="/login" className="ml-1 hidden rounded-lg px-3 py-2 font-mono text-xs font-semibold text-on-surface hover:bg-surface-container sm:block">{common("login")}</Link>
              <Link href="/login" className="rounded-lg bg-primary-container px-4 py-2 font-mono text-xs font-semibold text-white transition hover:bg-inverse-primary">{common("signup")}</Link>
            </>
          )}
        </div>
      </div>
      <HeaderNav mobile />
    </header>
  );
}
