import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import {login, signup} from "./actions";

export interface LoginPageProps { readonly searchParams: Promise<{message?: string}>; }

export default async function LoginPage({searchParams}: LoginPageProps) {
  const {message} = await searchParams;
  const t = await getTranslations("Login");
  const common = await getTranslations("Common");
  return (
    <SiteShell showSearch={false}>
      <section className="relative grid min-h-[720px] place-items-center overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_25%_20%,rgba(46,91,255,.2),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(125,1,177,.18),transparent_35%)]" />
        <div className="glass-panel relative w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-primary-container/10">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><span className="material-symbols-outlined text-[18px]">arrow_back</span>{common("brand")}</Link>
          <h1 className="mt-7 font-geist text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 leading-6 text-on-surface-variant">{t("description")}</p>
          {message && <p className="mt-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</p>}
          <form className="mt-7 space-y-4">
            <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary" placeholder="you@example.com" /></label>
            <label className="block text-sm font-medium">{t("password")}<input name="password" type="password" autoComplete="current-password" minLength={6} required className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary" placeholder={t("passwordPlaceholder")} /></label>
            <button formAction={login} className="w-full rounded-xl bg-primary-container px-4 py-3 font-semibold text-white transition hover:bg-inverse-primary">{t("submit")}</button>
            <button formAction={signup} className="w-full rounded-xl border border-primary/40 px-4 py-3 font-semibold text-primary transition hover:bg-primary/10">{t("signup")}</button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
