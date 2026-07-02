import {Link} from "@/i18n/navigation";
import type {BlogPost} from "@/content/blog";
import WaterTiltCard from "@/components/ui/WaterTiltCard";

export interface BlogCardProps {
  readonly post: BlogPost;
  readonly locale: string;
  readonly readLabel: string;
  readonly minuteLabel: string;
}

export default function BlogCard({post, locale, readLabel, minuteLabel}: BlogCardProps) {
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(post.publishedAt));
  return <WaterTiltCard className="rounded-2xl"><article className="flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low/65"><div className={`relative h-48 overflow-hidden bg-gradient-to-br ${post.glowClass}`}><div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:30px_30px]"/><span className="material-symbols-outlined absolute bottom-5 left-6 text-6xl text-primary">{post.icon}</span><span className="absolute right-4 top-4 rounded-full border border-white/15 bg-background/70 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-on-surface">{post.category}</span></div><div className="flex flex-1 flex-col p-6"><div className="flex items-center gap-2 font-mono text-[10px] text-on-surface-variant"><time dateTime={post.publishedAt}>{date}</time><span>·</span><span>{post.readingMinutes} {minuteLabel}</span></div><h2 className="mt-4 font-geist text-xl font-semibold leading-7"><Link href={`/blog/${post.slug}`} className="transition hover:text-primary">{post.title}</Link></h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="mt-auto flex items-center gap-1 pt-6 text-sm font-semibold text-primary">{readLabel}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link></div></article></WaterTiltCard>;
}
