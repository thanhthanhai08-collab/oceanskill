import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import AddSkillToLibraryButton from "@/components/skills/AddSkillToLibraryButton";
import SkillCard from "@/components/skills/SkillCard";
import SkillReviews from "@/components/skills/SkillReviews";
import CopyButton from "@/components/skills/CopyButton";
import {getDomainVisual} from "@/data/mockData";
import {getPublicSkill, listRelatedSkills, listSkillsByAuthor} from "@/lib/catalog/skills";
import {getSkillAuthor} from "@/lib/catalog/authors";
import {getSkillReviewState} from "@/lib/skills/reviews";
import {listSkillFaqs} from "@/lib/catalog/skill-faqs";
import {getSkillDetailContent} from "@/lib/catalog/skill-details";

export const dynamic = "force-dynamic";

export interface SkillDetailPageProps {
  readonly params: Promise<{slug: string; locale: string}>;
}

export default async function SkillDetailPage({params}: SkillDetailPageProps) {
  const {slug, locale} = await params;
  const skill = await getPublicSkill(slug, locale);
  if (!skill) notFound();
  const t = await getTranslations("SkillDetail");
  const visual = getDomainVisual(skill.domain);
  const version = skill.current_version ?? "1.0.0";
  const author = getSkillAuthor(skill);
  const [moreFromAuthor, relatedSkills, reviewState, faqs, detailContent] = await Promise.all([
    listSkillsByAuthor(skill.author_id ?? author.id, skill.slug, 2, locale),
    listRelatedSkills(skill.domain, skill.slug, 3, locale),
    getSkillReviewState(skill.id),
    listSkillFaqs(skill.id, locale),
    getSkillDetailContent(skill.id, locale),
  ]);

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
                  <span className="inline-flex items-center gap-2 font-semibold">
                    {t("by")}
                    <Link href={`/authors/${author.id}` as "/authors"} className="inline-flex items-center gap-2 text-primary transition hover:text-primary/70">
                      <span className={`grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${author.glow_class}`}>
                        {author.avatar_url ? <img src={author.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-[15px] text-white">{author.icon}</span>}
                      </span>
                      {author.name}
                    </Link>
                  </span>
                  <span className="font-bold text-tertiary">Top 1</span>
                  <span className="text-on-surface-variant">{reviewState.stats.count.toLocaleString()} {t("reviewsTitle").toLowerCase()}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("descriptionTitle")}</h2>
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/55 p-6">
              <h3 className="font-geist text-2xl font-bold">{detailContent?.headline ?? t("powerTitle")}</h3>
              <p className="mt-4 leading-7 text-on-surface-variant">{detailContent?.overview ?? t("powerDescription", {title: skill.title})}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-container-high p-5">
                  <span className="material-symbols-outlined text-primary">insights</span>
                  <h4 className="mt-3 font-geist font-bold">{detailContent?.feature_one_title ?? t("featureOneTitle")}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{detailContent?.feature_one_description ?? t("featureOneDescription")}</p>
                </div>
                <div className="rounded-xl bg-surface-container-high p-5">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h4 className="mt-3 font-geist font-bold">{detailContent?.feature_two_title ?? t("featureTwoTitle")}</h4>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{detailContent?.feature_two_description ?? t("featureTwoDescription")}</p>
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
                  ["1", t("mcpStepOne"), ""],
                  ["2", t("mcpStepTwo"), ""],
                  ["3", t("mcpStepThree"), ""],
                ].map(([index, label]) => (
                  <li key={index} className="flex gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">{index}</span>
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{label}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-7 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><span className="font-mono text-xs text-on-surface-variant">mcp.json</span><CopyButton text={`{\n  "mcpServers": {\n    "nskill": {\n      "serverUrl": "https://[your-project].supabase.co/functions/v1/mcp",\n      "headers": {\n        "Authorization": "Bearer YOUR_MCP_KEY"\n      }\n    }\n  }\n}`} label={t("copyConfig")} copiedLabel={t("copied")} /></div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-tertiary"><code>{`{\n  "mcpServers": {\n    "nskill": {\n      "serverUrl": "https://[your-project].supabase.co/functions/v1/mcp",\n      "headers": {\n        "Authorization": "Bearer YOUR_MCP_KEY"\n      }\n    }\n  }\n}`}</code></pre>
              </div>
              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm leading-6 text-on-surface-variant">{t("useSkillPrompt", {skill: "[tên-skill]"})}</p><CopyButton text={`Hãy dùng skill [tên-skill] từ nskill để làm việc này: [mô tả yêu cầu]`} label={t("copyPrompt")} copiedLabel={t("copied")} /></div></div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-geist text-xl font-bold">{t("faqTitle")}</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55">
              {faqs.map((faq, index) => (
                <details key={faq.id} className="group border-b border-white/5 p-5 last:border-b-0" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">{faq.question}<span className="material-symbols-outlined text-[20px] transition group-open:rotate-180">expand_more</span></summary>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-on-surface-variant">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <SkillReviews
            skillId={skill.id}
            locale={locale}
            initialReviews={reviewState.reviews}
            initialStats={reviewState.stats}
            initialOwnReview={reviewState.ownReview}
            labels={{
              title: t("reviewsTitle"),
              writeTitle: t("writeReviewTitle"),
              writeDescription: t("writeReviewDescription"),
              placeholder: t("writeReviewPlaceholder"),
              submit: t("submitReview"),
              update: t("updateReview"),
              basedOn: t("basedOnReviewCount", {count: "{count}"}),
              empty: t("emptyReviews"),
              loginRequired: t("reviewLoginRequired"),
              saveFailed: t("reviewSaveFailed"),
            }}
          />
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
          <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/20 via-surface-container-low to-secondary/15 p-6 shadow-[0_0_32px_rgba(184,195,255,0.16)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-geist text-lg font-bold">{t("favoriteTitle")}</h2>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-tertiary">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shadow-[0_0_20px_rgba(184,195,255,0.2)]">
                  <span className="material-symbols-outlined text-[21px]">verified</span>
                </span>
                {t("trustedSource")}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {skill.compatible_clients.map((client) => <span key={client} className="rounded-md bg-surface-container-lowest px-3 py-2 font-mono text-xs">{client}</span>)}
            </div>
            <dl className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{t("version")}</dt><dd className="font-mono">{version}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">{t("license")}</dt><dd>{skill.license_spdx ?? "Apache-2.0"}</dd></div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-on-surface-variant">{t("source")}</dt>
                <dd>
                  {skill.source_url ? (
                    <a href={skill.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-primary">
                      GitHub
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  ) : "OceanSkill"}
                </dd>
              </div>
            </dl>
            <div className="mt-7">
              <AddSkillToLibraryButton skillId={skill.id} labels={{add: t("addToLibrary"), added: t("addSuccess"), already: t("addAlready"), failed: t("addFailed")}} />
            </div>
            <Link href="/dashboard/mcp-keys" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-on-surface transition hover:bg-white/10">
              {t("createMcpKey")}
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            </Link>
          </section>

          {moreFromAuthor.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-geist font-bold">{t("moreFromCreator", {author: author.name})}</h2>
                <Link href={`/authors/${author.id}` as "/authors"} className="text-xs font-bold text-primary">{t("viewAll")}</Link>
              </div>
              <div className="space-y-3">
                {moreFromAuthor.map((related) => (
                  <Link key={related.id} href={`/skills/${related.slug}` as "/skills"} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-container-low/55 p-4 transition hover:bg-white/[0.04]">
                    <span className="min-w-0"><span className="block truncate font-semibold">{related.title}</span><span className="text-xs text-on-surface-variant">{related.domain}</span></span>
                    <span className="font-mono text-xs">{related.current_version ?? "1.0.0"}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

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
