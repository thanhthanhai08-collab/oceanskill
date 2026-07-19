import Link from "next/link";

export default function AdminNav({locale, active}:{locale:string;active:"skills"|"collections"|"blog"}) {
  const vi=locale==="vi"; const items=[{id:"skills",label:vi?"Skill":"Skills"},{id:"collections",label:vi?"Bộ sưu tập":"Collections"},{id:"blog",label:"Blog"}] as const;
  return <nav className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-2">{items.map((item)=><Link key={item.id} href={`/${locale}/admin/${item.id}`} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active===item.id?"bg-primary/15 text-primary":"text-on-surface-variant hover:bg-surface-container"}`}>{item.label}</Link>)}</nav>;
}
