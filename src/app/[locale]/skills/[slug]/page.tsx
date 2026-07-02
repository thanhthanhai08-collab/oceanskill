import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import SkillShowcase from "@/components/skills/SkillShowcase";
import SkillPurchasePanel from "@/components/skills/SkillPurchasePanel";
import SkillCard from "@/components/skills/SkillCard";
import AdSlot from "@/components/ads/AdSlot";
import {getPublicSkill, listRelatedSkills} from "@/lib/catalog/skills";

export const dynamic = "force-dynamic";

export interface SkillDetailPageProps { readonly params: Promise<{slug: string}>; }

export default async function SkillDetailPage({params}: SkillDetailPageProps) {
  const skill = await getPublicSkill((await params).slug);
  if (!skill) notFound();
  const t = await getTranslations("SkillDetail");
  const relatedSkills = await listRelatedSkills(skill.domain, skill.slug);
  return (
    <SiteShell>
      <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <Link href="/skills" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-on-surface"><span className="material-symbols-outlined text-[18px]">arrow_back</span>{t("back")}</Link>
        <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_1fr]">
          <SkillShowcase title={skill.title} domain={skill.domain} />
          <div>
            <div className="flex items-center gap-3"><span className="rounded-full bg-tertiary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-tertiary">{skill.domain}</span><span className="font-mono text-xs text-on-surface-variant">v{skill.current_version ?? "—"}</span></div>
            <h1 className="mt-5 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{skill.title}</h1>
            <p className="mt-5 text-lg leading-8 text-on-surface-variant">{skill.description}</p>
            <div className="mt-8"><SkillPurchasePanel skill={skill} labels={{availableVia: t("availableVia"), version: t("version"), license: t("license"), start: t("start"), verified: t("verified")}} /></div>
          </div>
        </div>

        <AdSlot label={t("advertisement")} className="mt-12" />

        <section className="mt-20 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-7 sm:p-9">
            <div className="flex items-center gap-3"><span className="material-symbols-outlined text-tertiary">shield_lock</span><h2 className="font-geist text-2xl font-semibold">{t("protectedTitle")}</h2></div>
            <p className="mt-4 leading-7 text-on-surface-variant">{t("protectedDescription")}</p>
            <ol className="mt-7 grid gap-3 font-mono text-xs text-on-surface-variant sm:grid-cols-3">
              {[t("stepOne"), t("stepTwo"), t("stepThree")].map((step, index) => <li key={step} className="rounded-xl border border-outline-variant/35 bg-background/50 p-4"><span className="mb-3 block text-primary">0{index + 1}</span>{step}</li>)}
            </ol>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-7 sm:p-9">
            <h2 className="font-geist text-2xl font-semibold">{t("compatibilityTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("compatibilityDescription")}</p>
            <div className="mt-6 space-y-3">{skill.compatible_clients.map((client) => <div key={client} className="flex items-center justify-between rounded-xl bg-surface-container p-4"><span className="font-semibold">{client}</span><span className="material-symbols-outlined text-tertiary">check_circle</span></div>)}</div>
          </div>
        </section>

        <section className="mt-16 max-w-4xl">
          <h2 className="font-geist text-2xl font-semibold">{t("faqTitle")}</h2>
          <div className="mt-5 space-y-3">
            {(["faqOne", "faqTwo", "faqThree"] as const).map((key) => <details key={key} className="group rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{t(`${key}Question`)}<span className="material-symbols-outlined float-right text-[20px] transition group-open:rotate-180">expand_more</span></summary><p className="mt-4 max-w-3xl text-sm leading-6 text-on-surface-variant">{t(`${key}Answer`)}</p></details>)}
          </div>
        </section>
        <section className="mt-16 border-t border-outline-variant/30 pt-14">
          <h2 className="font-geist text-3xl font-semibold">{t("relatedTitle")}</h2>
          <p className="mt-2 text-on-surface-variant">{t("relatedDescription", {domain: skill.domain})}</p>
          {relatedSkills.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{relatedSkills.map((related) => <SkillCard key={related.id} skill={related} actionLabel={t("viewSkill")} />)}</div> : <p className="mt-6 rounded-2xl border border-dashed border-outline-variant/40 p-8 text-center text-on-surface-variant">{t("noRelated")}</p>}
        </section>
      </article>
    </SiteShell>
  );
}
