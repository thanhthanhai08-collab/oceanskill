import {getTranslations} from "next-intl/server";

export default async function SecurityPage() {
  const t = await getTranslations("Dashboard");

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("settingsEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("settingsSecurity")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("settingsSecurityDescription")}</p>
      </header>

      {/* Change password */}
      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-primary">lock_reset</span>
          {t("changePassword")}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">{t("changePasswordHint")}</p>

        <form className="mt-6 space-y-4">
          <div>
            <label htmlFor="current-password" className="mb-1.5 block text-sm font-semibold">{t("currentPassword")}</label>
            <input id="current-password" type="password" disabled placeholder="••••••••"
              className="w-full cursor-not-allowed rounded-xl border border-outline-variant/30 bg-surface-container/50 px-4 py-3 text-sm text-on-surface-variant" />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold">{t("newPassword")}</label>
            <input id="new-password" type="password" disabled placeholder="••••••••"
              className="w-full cursor-not-allowed rounded-xl border border-outline-variant/30 bg-surface-container/50 px-4 py-3 text-sm text-on-surface-variant" />
          </div>
          <div className="flex justify-end pt-1">
        <button type="submit" disabled className="btn-payment rounded-xl px-6 py-3 text-sm font-semibold opacity-50">
              {t("updatePassword")} <span className="ml-1 text-[10px] opacity-70">(coming soon)</span>
            </button>
          </div>
        </form>
      </section>

      {/* Active sessions (stub) */}
      <section className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <h2 className="flex items-center gap-3 font-geist text-xl font-semibold">
          <span className="material-symbols-outlined text-secondary">devices</span>
          {t("activeSessions")}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">{t("activeSessionsDescription")}</p>
        <div className="mt-5 rounded-xl border border-dashed border-outline-variant/40 p-6 text-center text-sm text-on-surface-variant">
          {t("sessionsComingSoon")}
        </div>
      </section>
    </>
  );
}
