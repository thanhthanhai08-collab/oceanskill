import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getUserApiKeys} from "@/lib/api-keys/manage";
import ApiKeyManager from "@/components/dashboard/ApiKeyManager";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, data] = await Promise.all([
    getTranslations("Dashboard"),
    getUserApiKeys(),
  ]);

  if (!data) redirect(`/${locale}/login`);

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("apiKeysEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight sm:text-4xl">{t("apiKeysTitle")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("apiKeysDescription")}</p>
      </header>

      {/* Security notice */}
      <div className="mt-6 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5">
        <h2 className="flex items-center gap-2 font-geist text-lg font-semibold">
          <span className="material-symbols-outlined text-[20px] text-primary">shield_lock</span>
          {t("securityTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("securityDescription")}</p>
      </div>

      {/* Client-side key manager */}
      <div className="mt-8">
        <ApiKeyManager
          initialKeys={data.keys}
          locale={locale}
          labels={{
            title: t("apiKeysTitle"),
            description: t("apiKeysDescription"),
            createKey: t("createKey"),
            keyName: t("keyName"),
            keyNamePlaceholder: t("keyNamePlaceholder"),
            creating: t("creating"),
            active: t("active"),
            revoked: t("revoked"),
            lastUsed: t("lastUsed"),
            never: t("never"),
            revokeKey: t("revokeKey"),
            revoking: t("revoking"),
            copyKey: t("copyKey"),
            copied: t("copied"),
            emptyKeys: t("emptyKeys"),
            newKeyWarning: t("newKeyWarning"),
          }}
        />
      </div>
    </>
  );
}
