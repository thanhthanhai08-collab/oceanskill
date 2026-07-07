import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import {getDomainVisual} from "@/data/mockData";
import {listAuthorSkills} from "@/lib/catalog/authors";

export const dynamic = "force-dynamic";

export default async function AuthorPage({params}: {readonly params: Promise<{id: string; locale: string}>}) {
  const {id, locale} = await params;
  const result = await listAuthorSkills(id);
  if (!result) notFound();

  const {author, skills} = result;
  const t = await getTranslations("Marketplace");
  const rating = skills.length ? "4.9" : "New";

  return (
    <SiteShell>
      <main className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/55 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="relative">
                <div className={`grid h-32 w-32 place-items-center rounded-full border border-primary/40 bg-gradient-to-br ${author.glowClass} shadow-[0_0_30px_rgba(184,195,255,0.22)]`}>
                  <span className="material-symbols-outlined text-5xl text-white">{author.icon}</span>
                </div>
                <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-4 border-background bg-primary text-on-primary">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                </span>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">Verified creator</p>
                <h1 className="mt-2 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{author.name}</h1>
                <p className="mt-2 font-mono text-sm text-primary">{author.handle}</p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">{author.bio}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                  {author.focus.map((item) => <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{item}</span>)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">Published skills</p>
                <p className="mt-2 font-geist text-3xl font-bold">{skills.length}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-secondary/10 to-tertiary/10 p-5 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">Average rating</p>
                <p className="mt-2 inline-flex items-center justify-center gap-1 font-geist text-3xl font-bold">{rating}<span className="material-symbols-outlined text-[22px] text-primary">star</span></p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 mt-12 flex items-center gap-4">
          <h2 className="shrink-0 font-geist text-2xl font-bold">Published skills</h2>
          <div className="h-px w-full bg-gradient-to-r from-outline-variant/70 to-transparent" />
        </div>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill, index) => {
            const visual = getDomainVisual(skill.domain);
            return (
              <Link key={skill.id} href={`/skills/${skill.slug}`} className={`group flex min-h-[360px] flex-col overflow-hidden rounded-xl border bg-surface-container-low/70 transition duration-300 hover:-translate-y-1 hover:border-primary/55 hover:shadow-[0_0_30px_rgba(46,91,255,0.18)] ${index === 0 ? "border-primary/55" : "border-outline-variant/45"}`}>
                <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${visual.glowClass}`}>
                  <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-[64px] ${visual.accentClass} transition group-hover:scale-110`}>{visual.icon}</span>
                  <span className="absolute left-3 top-3 rounded-md border border-white/15 bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-on-surface">{skill.domain}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-geist text-lg font-semibold transition group-hover:text-primary">{skill.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{skill.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skill.compatible_clients.slice(0, 2).map((client) => <span key={client} className="rounded-md bg-surface-container-high px-2 py-1 font-mono text-[10px] text-on-surface-variant">{client}</span>)}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-4">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-tertiary"><span className="material-symbols-outlined text-[16px]">star</span>{index === 0 ? "5.0" : "4.8"}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">{t("viewSkill")}<span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-1">arrow_forward</span></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-on-surface-variant">
          {new Intl.NumberFormat(locale).format(skills.length)} skills available from {author.name}
        </p>
      </main>
    </SiteShell>
  );
}
