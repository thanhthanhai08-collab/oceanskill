import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import SkillCard from "@/components/skills/SkillCard";
import {getDomainVisual} from "@/data/mockData";
import {getPublicSkill, listRelatedSkills} from "@/lib/catalog/skills";
import {addPlatformSkill} from "@/app/[locale]/dashboard/actions";

export const dynamic = "force-dynamic";

export interface SkillDetailPageProps {
  readonly params: Promise<{slug: string; locale: string}>;
}

export default async function SkillDetailPage({params}: SkillDetailPageProps) {
  const {slug, locale} = await params;
  const skill = await getPublicSkill(slug);
  if (!skill) notFound();
  const t = await getTranslations("SkillDetail");
  const relatedSkills = await listRelatedSkills(skill.domain, skill.slug);
  const visual = getDomainVisual(skill.domain);
  const version = skill.current_version ?? "1.0.0";
  const ratingRows = [
    {stars: 5, value: 85},
    {stars: 4, value: 12},
    {stars: 3, value: 2},
    {stars: 2, value: 1},
    {stars: 1, value: 0},
  ];

  return (
    <SiteShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0 space-y-10">
          <section className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-start gap-6">
              <div className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-primary/50 bg-surface-container-lowest shadow-[0_0_32px_rgba(184,195,255,0.35)] ${visual.accentClass}`}>
                <span className="material-symbols-outlined text-5xl">{visual.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-surface-container-highest px-3 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">{skill.domain}</span>
                  <span className="rounded-full bg-secondary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-secondary">OceanSkill</span>
                  <span className="rounded-full bg-surface-container-highest px-3 py-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">v{version}</span>
                </div>
                <h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{skill.title}</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-on-surface-variant">{skill.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-2 font-semibold"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"><span className="material-symbols-outlined text-[14px]">verified</span></span>{t("by")} NeuralSystems</span>
                  <span className="font-bold text-tertiary">Top 1</span>
                  <span className="text-on-surface-variant">1.2K {t("sales")}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("descriptionTitle")}</h2>
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
              <h3 className="font-geist text-2xl font-bold">{t("powerTitle")}</h3>
              <p className="mt-4 leading-7 text-on-surface-variant">{t("powerDescription", {title: skill.title})}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-container-high p-5">
                  <span className="material-symbols-outlined text-primary">insights</span>
                  <h4 className="mt-3 font-geist font-bold">{t("featureOneTitle")}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("featureOneDescription")}</p>
                </div>
                <div className="rounded-xl bg-surface-container-high p-5">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h4 className="mt-3 font-geist font-bold">{t("featureTwoTitle")}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("featureTwoDescription")}</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("installTitle")}</h2>
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
              <h3 className="font-geist text-2xl font-bold">{t("setupTitle")}</h3>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("setupDescription")}</p>
              <ol className="mt-6 space-y-5">
                {[
                  ["1", t("installStepOne"), "npm install -g @nskill/cli-tool"],
                  ["2", t("installStepTwo"), "nskill auth --key YOUR_V4_ACCESS_KEY"],
                  ["3", t("installStepThree"), `nskill enable ${skill.slug}`],
                ].map(([index, label, command]) => (
                  <li key={index} className="flex gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">{index}</span>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <code className="mt-2 block w-fit rounded-md bg-black px-4 py-2 font-mono text-xs text-tertiary">{command}</code>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("faqTitle")}</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55">
              {(["faqOne", "faqTwo", "faqThree"] as const).map((key) => (
                <details key={key} className="group border-b border-white/5 p-5 last:border-b-0" open={key === "faqOne"}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">{t(`${key}Question`)}<span className="material-symbols-outlined text-[20px] transition group-open:rotate-180">expand_more</span></summary>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-on-surface-variant">{t(`${key}Answer`)}</p>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("reviewsTitle")}</h2>
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
              <div className="grid gap-8 sm:grid-cols-[150px_minmax(0,1fr)]">
                <div className="text-center">
                  <p className="font-geist text-5xl font-bold text-primary">4.9</p>
                  <p className="mt-2 text-primary">★★★★★</p>
                  <p className="mt-2 text-xs text-on-surface-variant">{t("basedOnReviews")}</p>
                </div>
                <div className="space-y-3">
                  {ratingRows.map((row) => (
                    <div key={row.stars} className="grid grid-cols-[18px_1fr_36px] items-center gap-3 text-xs">
                      <span>{row.stars}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-surface-container-highest"><span className="block h-full rounded-full bg-primary" style={{width: `${row.value}%`}} /></span>
                      <span className="text-right text-on-surface-variant">{row.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[
                ["Alex Lindholm", t("reviewOne")],
                ["Sarah Chen", t("reviewTwo")],
              ].map(([name, body]) => (
                <article key={name} className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-5">
                  <div className="flex items-center justify-between gap-4"><p className="font-geist font-bold">{name}</p><span className="text-primary">★★★★★</span></div>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/20 via-surface-container-low to-secondary/15 p-6 shadow-[0_0_32px_rgba(184,195,255,0.16)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-geist text-lg font-bold">{t("favoriteTitle")}</h2>
              <span className="text-xs font-bold text-tertiary">{t("trustedSource")}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {skill.compatible_clients.map((client) => <span key={client} className="rounded-md bg-surface-container-lowest px-3 py-2 font-mono text-xs">{client}</span>)}
            </div>
            <dl className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{t("version")}</dt><dd className="font-mono">{version}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{t("license")}</dt><dd>{skill.license_spdx ?? "Apache-2.0"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{t("source")}</dt><dd>{skill.source_url ? "GitHub" : "OceanSkill"}</dd></div>
            </dl>
            <form action={addPlatformSkill} className="mt-7">
              <input type="hidden" name="skillId" value={skill.id}/>
              <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-on-primary transition hover:brightness-110">
                {t("addToLibrary")}
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </button>
            </form>
            <Link href="/dashboard/mcp-keys" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-on-surface transition hover:bg-white/10">
              {t("createMcpKey")}
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            </Link>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-geist font-bold">{t("moreFromCreator")}</h2>
              <Link href="/skills" className="text-xs font-bold text-primary">{t("viewAll")}</Link>
            </div>
            <div className="space-y-3">
              {relatedSkills.slice(0, 2).map((related) => (
                <Link key={related.id} href={`/skills/${related.slug}` as "/skills"} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-container-low/55 p-4 transition hover:bg-white/[0.04]">
                  <span className="min-w-0"><span className="block truncate font-semibold">{related.title}</span><span className="text-xs text-on-surface-variant">{related.domain}</span></span>
                  <span className="font-mono text-xs">$89</span>
                </Link>
              ))}
            </div>
          </section>

          {relatedSkills.length > 0 && (
            <section>
              <h2 className="mb-3 font-geist font-bold">{t("relatedTitle")}</h2>
              <div className="grid gap-4">{relatedSkills.slice(0, 2).map((related) => <SkillCard key={related.id} skill={related} actionLabel={t("viewSkill")} />)}</div>
            </section>
          )}
        </aside>
      </main>
    </SiteShell>
  );
}
