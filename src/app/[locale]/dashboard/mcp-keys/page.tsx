import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {getUserMcpKeys} from "@/lib/mcp-keys/manage";
import McpKeyManager from "@/components/dashboard/McpKeyManager";

export const dynamic = "force-dynamic";

export default async function McpKeysPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const [t, data] = await Promise.all([
    getTranslations("Dashboard"),
    getUserMcpKeys(),
  ]);

  if (!data) redirect(`/${locale}/login`);

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{t("mcpKeysEyebrow")}</p>
        <h1 className="mt-3 font-geist text-5xl font-bold tracking-tight">{t("mcpKeysTitle")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("mcpKeysDescription")}</p>
      </header>

      <div className="mt-12">
        <McpKeyManager
          initialKeys={data.keys}
          locale={locale}
          labels={{
            title: t("mcpKeysTitle"),
            description: t("mcpKeysDescription"),
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

      <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary"><span className="material-symbols-outlined">shield</span></div>
          <h2 className="font-geist text-lg font-bold">{t("securityTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("securityDescription")}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary"><span className="material-symbols-outlined">bolt</span></div>
          <h2 className="font-geist text-lg font-bold">{t("lowLatencyTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("lowLatencyDescription")}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-container-low/55 p-6 transition hover:-translate-y-1">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><span className="material-symbols-outlined">history</span></div>
          <h2 className="font-geist text-lg font-bold">{t("auditLogTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("auditLogDescription")}</p>
        </div>
      </section>
    </>
  );
}
