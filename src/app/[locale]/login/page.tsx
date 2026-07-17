import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import {login, resetPassword, signInWithProvider} from "./actions";

export interface LoginPageProps { readonly searchParams: Promise<{message?: string}>; }

export default async function LoginPage({searchParams}: LoginPageProps) {
  const {message} = await searchParams;
  const t = await getTranslations("Login");
  return (
    <SiteShell showSearch={false}>
      <section className="relative grid min-h-[720px] place-items-center overflow-hidden px-6 py-16">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_25%_20%,rgba(46,91,255,.2),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(125,1,177,.18),transparent_35%)]" />
        <div className="glass-panel relative w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-primary-container/10">
          <h1 className="font-geist text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 leading-6 text-on-surface-variant">{t("description")}</p>
          {message && <p className="mt-5 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</p>}
          <form className="mt-7 space-y-4">
            <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary" placeholder="you@example.com" /></label>
            <div>
              <label className="block text-sm font-medium">{t("password")}<input name="password" type="password" autoComplete="current-password" minLength={6} required className="mt-2 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none transition focus:border-primary" placeholder={t("passwordPlaceholder")} /></label>
              <div className="mt-2 flex justify-end">
                <button formAction={resetPassword} formNoValidate className="text-sm font-semibold text-primary transition hover:text-primary/70">{t("forgotPassword")}</button>
              </div>
            </div>
          <button formAction={login} className="btn-payment w-full rounded-xl px-4 py-3 font-semibold hover:brightness-105">{t("submit")}</button>
          </form>
          <div className="relative mt-7 flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-outline-variant/40" />
            <span className="relative bg-background px-5 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{t("orEmail")}</span>
          </div>
          <div className="mt-6 grid gap-3">
            <form>
              <input type="hidden" name="provider" value="google" />
              <button formAction={signInWithProvider} className="flex w-full items-center justify-center gap-3 rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-3 font-semibold text-on-surface shadow-sm shadow-primary-container/5 transition hover:border-primary/50 hover:bg-primary/10">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-container text-[12px] font-bold text-primary">G</span>
                {t("continueGoogle")}
              </button>
            </form>
            <form>
              <input type="hidden" name="provider" value="github" />
              <button formAction={signInWithProvider} className="flex w-full items-center justify-center gap-3 rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-3 font-semibold text-on-surface shadow-sm shadow-primary-container/5 transition hover:border-primary/50 hover:bg-primary/10">
                <span className="material-symbols-outlined text-[20px] text-primary">code</span>
                {t("continueGithub")}
              </button>
            </form>
          </div>
          <p className="mt-7 text-center text-sm text-on-surface-variant">
            {t("noAccount")} <Link href="/signup" className="font-bold text-primary transition hover:text-primary/70">{t("signupNow")}</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
