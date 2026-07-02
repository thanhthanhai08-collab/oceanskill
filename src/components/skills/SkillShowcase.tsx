import {getDomainVisual} from "@/data/mockData";

export interface SkillShowcaseProps { readonly title: string; readonly domain: string; }

export default function SkillShowcase({title, domain}: SkillShowcaseProps) {
  const visual = getDomainVisual(domain);
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl border border-outline-variant/50 bg-gradient-to-br ${visual.glowClass}`} role="img" aria-label={title}>
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.09)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute inset-[14%] rotate-6 rounded-[2rem] border border-white/10 bg-background/35 backdrop-blur" />
      <div className="absolute inset-[26%] -rotate-6 rounded-3xl border border-tertiary/25 bg-surface-container/50" />
      <span className={`material-symbols-outlined absolute inset-0 grid place-items-center text-[112px] ${visual.accentClass} drop-shadow-[0_0_24px_currentColor]`}>{visual.icon}</span>
      <span className="absolute bottom-5 left-5 rounded-md border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-on-surface">{domain}</span>
    </div>
  );
}
