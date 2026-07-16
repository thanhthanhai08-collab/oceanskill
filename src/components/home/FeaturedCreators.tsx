import {getTranslations} from "next-intl/server";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {listPublicSkills} from "@/lib/catalog/skills";

export default async function FeaturedCreators() {
  const t = await getTranslations("Home");
  const skills = await listPublicSkills();
  const creators = [...new Map(skills.flatMap((skill) => skill.authors ? [[skill.authors.id, skill.authors] as const] : [])).values()].slice(0, 3);
  return (
    <section className="border-b border-outline-variant/35 bg-surface-container-low/55 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{t("creatorsEyebrow")}</p><h2 className="mt-5 text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("creatorsTitle")}</h2><p className="mt-5 max-w-md text-pretty leading-7 text-on-surface-variant">{t("creatorsSubtitle")}</p></div>
        <div className="border-t border-outline-variant/50 lg:col-span-8">
          {creators.map((creator, index) => <Link key={creator.id} href={`/authors/${creator.id}` as "/authors"} className="group grid gap-5 border-b border-outline-variant/50 py-7 transition hover:bg-surface-container-lowest/55 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5"><span className="font-mono text-[10px] text-on-surface-variant">0{index + 1}</span><span className="flex min-w-0 items-center gap-4"><span className={`relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br ${creator.glow_class}`}>{creator.avatar_url ? <Image src={creator.avatar_url} alt="" fill unoptimized sizes="48px" className="object-cover" /> : <span className="material-symbols-outlined text-2xl text-white">{creator.icon}</span>}</span><span className="min-w-0"><span className="block font-geist text-xl font-semibold transition group-hover:text-primary">{creator.name}</span><span className="mt-1 block font-mono text-[11px] text-primary">{creator.handle}</span></span></span><span className="flex items-center gap-4 sm:max-w-sm"><span className="hidden text-sm leading-6 text-on-surface-variant md:block">{creator.bio}</span><span className="material-symbols-outlined text-[20px] text-primary transition group-hover:translate-x-1">arrow_forward</span></span></Link>)}
        </div>
      </div>
    </section>
  );
}
