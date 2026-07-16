import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import CopyButton from "@/components/skills/CopyButton";

const config = `{
  "mcpServers": {
    "oceanskill": {
      "serverUrl": "https://YOUR_PROJECT.supabase.co/functions/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_NSK_KEY"
      }
    }
  }
}`;

const sectionLinks = ["start", "connect", "workflow", "collections", "requestId", "tools", "errors"] as const;
const steps = ["account", "key", "client", "verify"] as const;
const workflow = ["discover", "enable", "invoke"] as const;
const collectionSteps = ["create", "open", "agent"] as const;
const requestRules = ["new", "retry", "failed", "conflict"] as const;
const tools = ["list", "search", "content", "reference", "collections", "addCollection", "toggle", "usage"] as const;
const errors = ["auth", "credits", "access", "conflict", "server"] as const;

export default async function DocumentPage() {
  const t = await getTranslations("Docs");

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8 lg:py-20">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1 rounded-2xl border border-outline-variant/35 bg-surface-container-low/55 p-4 text-sm" aria-label={t("onThisPage")}>
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{t("onThisPage")}</p>
            {sectionLinks.map((section) => <a key={section} href={`#${section}`} className="block rounded-lg px-3 py-2 text-on-surface-variant transition hover:bg-primary/10 hover:text-primary">{t(`nav.${section}`)}</a>)}
          </nav>
        </aside>

        <main className="min-w-0">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-4xl font-geist text-4xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-on-surface-variant">{t("description")}</p>
          </header>

          <section id="start" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("startEyebrow")} title={t("startTitle")} description={t("startDescription")} />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {steps.map((step, index) => <InfoCard key={step} icon={String(index + 1).padStart(2, "0")} title={t(`steps.${step}.title`)} description={t(`steps.${step}.description`)} mono />)}
            </div>
          </section>

          <section id="connect" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("connectEyebrow")} title={t("connectTitle")} description={t("connectDescription")} accent="secondary" />
            <div className="mt-7 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-3"><span className="font-mono text-xs text-on-surface-variant">mcp.json</span><CopyButton text={config} label={t("copy")} copiedLabel={t("copied")} /></div>
              <pre className="overflow-x-auto p-6 font-mono text-sm leading-7 text-primary"><code>{config}</code></pre>
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-error/25 bg-error/5 p-4 text-sm leading-6 text-on-surface-variant"><span className="material-symbols-outlined text-[19px] text-error">key_off</span>{t("configWarning")}</p>
            <h3 className="mt-8 font-geist text-xl font-semibold">{t("clientNoteTitle")}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {(["url", "key", "reload"] as const).map((note) => <div key={note} className="rounded-xl border border-outline-variant/35 bg-surface-container-low/45 p-5 text-sm leading-6 text-on-surface-variant">{t(`clientNotes.${note}`)}</div>)}
            </div>
          </section>

          <section id="workflow" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("workflowEyebrow")} title={t("workflowTitle")} description={t("workflowDescription")} />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => <InfoCard key={item} icon={["travel_explore", "library_add_check", "play_circle"][index]} title={t(`workflow.${item}.title`)} description={t(`workflow.${item}.description`)} />)}
            </div>
          </section>

          <section id="collections" className="scroll-mt-28 pt-16">
            <div className="overflow-hidden rounded-3xl border border-secondary/25 bg-gradient-to-br from-secondary/10 via-surface-container-low/70 to-primary/10 p-6 sm:p-8">
              <SectionHeading eyebrow={t("collectionsEyebrow")} title={t("collectionsTitle")} description={t("collectionsDescription")} accent="secondary" />
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {collectionSteps.map((item, index) => <InfoCard key={item} icon={["create_new_folder", "folder_open", "smart_toy"][index]} title={t(`collectionSteps.${item}.title`)} description={t(`collectionSteps.${item}.description`)} />)}
              </div>
            </div>
          </section>

          <section id="requestId" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("requestEyebrow")} title={t("requestTitle")} description={t("requestDescription")} accent="tertiary" />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {requestRules.map((rule, index) => <InfoCard key={rule} icon={["add_circle", "replay", "error", "swap_horiz"][index]} title={t(`requestRules.${rule}.title`)} description={t(`requestRules.${rule}.description`)} />)}
            </div>
            <div className="mt-5 rounded-2xl border border-tertiary/30 bg-tertiary/10 p-6"><p className="font-geist text-lg font-semibold text-tertiary">{t("creditTitle")}</p><p className="mt-2 text-sm leading-7 text-on-surface-variant">{t("creditDescription")}</p></div>
          </section>

          <section id="tools" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("toolsEyebrow")} title={t("toolsTitle")} description={t("toolsDescription")} />
            <div className="mt-7 overflow-hidden rounded-2xl border border-outline-variant/40">
              {tools.map((tool) => <div key={tool} className="grid gap-2 border-b border-outline-variant/30 bg-surface-container-low/45 p-5 last:border-0 md:grid-cols-[250px_1fr]"><code className="font-mono text-sm text-primary">{t(`tools.${tool}.name`)}</code><p className="text-sm leading-6 text-on-surface-variant">{t(`tools.${tool}.description`)}</p></div>)}
            </div>
          </section>

          <section id="errors" className="scroll-mt-28 pt-16">
            <SectionHeading eyebrow={t("errorsEyebrow")} title={t("errorsTitle")} />
            <div className="mt-7 space-y-3">
              {errors.map((error) => <div key={error} className="grid gap-2 rounded-xl border border-outline-variant/35 bg-surface-container-low/45 p-5 md:grid-cols-[230px_1fr]"><code className="font-mono text-xs font-semibold text-error">{t(`errors.${error}.code`)}</code><p className="text-sm leading-6 text-on-surface-variant">{t(`errors.${error}.description`)}</p></div>)}
            </div>
          </section>

          <section className="mt-16 rounded-3xl bg-gradient-to-r from-primary-container/80 to-secondary-container/80 p-8 text-white">
            <h2 className="font-geist text-3xl font-semibold">{t("ctaTitle")}</h2><p className="mt-3 max-w-2xl text-white/80">{t("ctaDescription")}</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard/mcp-keys" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-on-primary">{t("openKeys")}</Link><Link href="/dashboard/collections" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white">{t("openCollections")}</Link></div>
          </section>
        </main>
      </div>
    </SiteShell>
  );
}

function SectionHeading({eyebrow, title, description, accent = "primary"}: Readonly<{eyebrow: string; title: string; description?: string; accent?: "primary" | "secondary" | "tertiary"}>) {
  return <><span className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${accent === "secondary" ? "bg-secondary/10 text-secondary" : accent === "tertiary" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>{eyebrow}</span><h2 className="mt-4 font-geist text-3xl font-semibold">{title}</h2>{description && <p className="mt-3 max-w-3xl leading-7 text-on-surface-variant">{description}</p>}</>;
}

function InfoCard({icon, title, description, mono = false}: Readonly<{icon: string; title: string; description: string; mono?: boolean}>) {
  return <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-5"><span className={mono ? "font-mono text-xs text-tertiary" : "material-symbols-outlined text-2xl text-tertiary"}>{icon}</span><h3 className="mt-4 font-geist text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-on-surface-variant">{description}</p></article>;
}
