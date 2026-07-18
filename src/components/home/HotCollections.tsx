import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import type {SkillCollection} from "@/lib/skills/collections";

function collectionSpan(index: number, count: number) {
  if (count === 1 || (count === 3 && index === 2)) return "lg:col-span-12";
  return index === 0 ? "lg:col-span-7 lg:min-h-[30rem] lg:p-10" : "lg:col-span-5";
}

export default async function HotCollections({collections}: {readonly collections: SkillCollection[]}) {
  const [t, marketplace] = await Promise.all([getTranslations("Home"), getTranslations("Marketplace")]);
  const visibleCollections = collections.slice(0, 3);
  if (!visibleCollections.length) return null;
  return (
    <section className="border-b border-outline-variant/35 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end"><div className="lg:col-span-8"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{t("collectionsEyebrow")}</p><h2 className="mt-5 text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("collectionsTitle")}</h2><p className="mt-4 max-w-2xl leading-7 text-on-surface-variant">{t("collectionsSubtitle")}</p></div><Link href="/skills" className="hidden text-right text-sm font-semibold text-primary underline decoration-outline-variant underline-offset-4 hover:decoration-primary sm:block lg:col-span-4">{t("viewAll")}</Link></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          {visibleCollections.map((collection, index) => <Link key={collection.id} href={`/skills/collections/${collection.slug}` as "/skills"} className={`group relative flex min-h-64 flex-col overflow-hidden border border-outline-variant/45 bg-surface-container-low/55 p-7 transition duration-300 hover:-translate-y-1 hover:border-primary/55 ${collectionSpan(index, visibleCollections.length)}`}><span className="absolute right-5 top-3 font-mono text-7xl font-semibold tracking-[-0.08em] text-primary/[.07]">0{index + 1}</span><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{t("collectionBadge")}</span><div className="mt-auto max-w-xl"><h3 className={`${index === 0 ? "text-3xl sm:text-4xl" : "text-2xl"} text-balance font-geist font-semibold tracking-tight`}>{collection.name}</h3><p className="mt-4 text-sm leading-6 text-on-surface-variant">{collection.description}</p><span className="mt-5 block font-mono text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">{marketplace("collectionSkillCount", {count: collection.skillIds.length})}</span><span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("viewAll")}<span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-1">arrow_forward</span></span></div></Link>)}
        </div>
      </div>
    </section>
  );
}
