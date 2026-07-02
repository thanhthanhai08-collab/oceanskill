import {getTranslations} from "next-intl/server";

export default async function NotificationsPage() {
  const t = await getTranslations("Dashboard");

  const notificationOptions = [
    {id: "low-credit", icon: "account_balance_wallet", label: t("notifLowCredit"), description: t("notifLowCreditDesc")},
    {id: "new-skill", icon: "deployed_code", label: t("notifNewSkill"), description: t("notifNewSkillDesc")},
    {id: "order-status", icon: "receipt_long", label: t("notifOrderStatus"), description: t("notifOrderStatusDesc")},
    {id: "security", icon: "shield_lock", label: t("notifSecurity"), description: t("notifSecurityDesc")},
  ] as const;

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("settingsEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("settingsNotifications")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("settingsNotificationsDescription")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        <div className="divide-y divide-outline-variant/25">
          {notificationOptions.map((opt) => (
            <div key={opt.id} className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined mt-0.5 text-[22px] text-primary">{opt.icon}</span>
                <div>
                  <p className="font-semibold">{opt.label}</p>
                  <p className="mt-1 text-sm text-on-surface-variant">{opt.description}</p>
                </div>
              </div>
              {/* Toggle stub */}
              <button
                type="button"
                disabled
                aria-label={`Toggle ${opt.label}`}
                className="relative mt-1 h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-surface-container-high opacity-60 transition"
              >
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-on-surface-variant shadow transition" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-on-surface-variant">{t("notificationsComingSoon")}</p>
      </section>
    </>
  );
}
