import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import WaterTiltCard from "@/components/ui/WaterTiltCard";
import {hotCollections} from "@/data/mockData";

export default async function HotCollections() {
  const t = await getTranslations("Home");
  return (
    <section className="border-b border-outline-variant/25 bg-surface-container-lowest/45 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("collectionsEyebrow")}</p><h2 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("collectionsTitle")}</h2><p className="mt-2 text-on-surface-variant">{t("collectionsSubtitle")}</p></div><Link href="/skills" className="hidden text-sm font-semibold text-primary hover:underline sm:block">{t("viewAll")}</Link></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {hotCollections.map((collection) => <WaterTiltCard key={collection.id} className="rounded-2xl"><Link href="/skills" className={`group flex h-full min-h-64 flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-gradient-to-br ${collection.glowClass} p-7`}><span className="material-symbols-outlined text-5xl text-primary transition group-hover:scale-110">{collection.icon}</span><div className="mt-auto"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">{t("collectionBadge")}</p><h3 className="mt-2 font-geist text-2xl font-semibold">{t(`collections.${collection.id}.title`)}</h3><p className="mt-3 text-sm leading-6 text-on-surface-variant">{t(`collections.${collection.id}.description`)}</p></div></Link></WaterTiltCard>)}
        </div>
      </div>
    </section>
  );
}
