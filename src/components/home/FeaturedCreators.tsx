import {getTranslations} from "next-intl/server";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import WaterTiltCard from "@/components/ui/WaterTiltCard";
import {listPublicSkills} from "@/lib/catalog/skills";

export default async function FeaturedCreators() {
  const t = await getTranslations("Home");
  const skills = await listPublicSkills();
  const creators = [...new Map(skills.flatMap((skill) => skill.authors ? [[skill.authors.id, skill.authors] as const] : [])).values()].slice(0, 3);
  return (
    <section className="border-b border-outline-variant/25 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">{t("creatorsEyebrow")}</p><h2 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("creatorsTitle")}</h2><p className="mx-auto mt-2 max-w-2xl text-on-surface-variant">{t("creatorsSubtitle")}</p></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {creators.map((creator) => <WaterTiltCard key={creator.id} className="rounded-2xl"><Link href={`/authors/${creator.id}` as "/authors"} className="group block h-full rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6 transition hover:border-primary/45"><div className={`relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${creator.glow_class}`}>{creator.avatar_url ? <Image src={creator.avatar_url} alt="" fill unoptimized sizes="64px" className="object-cover" /> : <span className="material-symbols-outlined text-3xl text-white">{creator.icon}</span>}</div><h3 className="mt-5 font-geist text-xl font-semibold transition group-hover:text-primary">{creator.name}</h3><p className="mt-1 font-mono text-xs text-primary">{creator.handle}</p><p className="mt-4 text-sm leading-6 text-on-surface-variant">{creator.bio}</p></Link></WaterTiltCard>)}
        </div>
      </div>
    </section>
  );
}
