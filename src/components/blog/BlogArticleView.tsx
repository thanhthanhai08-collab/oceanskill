import Image from "next/image";
import type {ReactNode} from "react";
import type {BlogPost} from "@/content/blog";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import BlogCard from "@/components/blog/BlogCard";
import MarkdownArticle from "@/components/blog/MarkdownArticle";
import SaveArticleButton from "@/components/blog/SaveArticleButton";

export type BlogArticleLabels = Readonly<{
  back: string;
  minuteRead: string;
  by: string;
  published: string;
  save: string;
  saved: string;
  relatedTitle: string;
  relatedDescription: string;
  readArticle: string;
}>;

export default function BlogArticleView({post, related, locale, labels, adminBanner, showSave = true, readOnly = false}: {post: BlogPost; related: BlogPost[]; locale: string; labels: BlogArticleLabels; adminBanner?: ReactNode; showSave?: boolean; readOnly?: boolean}) {
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "long"}).format(new Date(post.publishedAt));
  return <SiteShell>
    {adminBanner}
    <article className={readOnly ? "pointer-events-none" : ""}>
      <header className="border-b border-outline-variant/25"><div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><span className="material-symbols-outlined text-[18px]">arrow_back</span>{labels.back}</Link>
        <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs text-on-surface-variant"><span className="rounded-full bg-tertiary/10 px-3 py-1 text-tertiary">{post.category}</span><span>{post.readingMinutes} {labels.minuteRead}</span></div>
        <h1 className="mt-5 max-w-4xl font-geist text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{post.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">{post.excerpt}</p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-6"><p className="text-sm text-on-surface-variant">{labels.by} <span className="font-semibold text-on-surface">{post.author}</span> · {labels.published} <time dateTime={post.publishedAt}>{date}</time></p>{showSave && <SaveArticleButton slug={post.slug} saveLabel={labels.save} savedLabel={labels.saved}/>}</div>
        {post.coverImageUrl && <div className="relative mt-9 aspect-video overflow-hidden rounded-3xl border border-outline-variant/35 bg-surface-container-low"><Image src={post.coverImageUrl} alt={post.title} fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover"/></div>}
      </div></header>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="space-y-10">{post.contentMarkdown ? <MarkdownArticle content={post.contentMarkdown}/> : post.sections.map((section) => <section key={section.heading}><h2 className="font-geist text-2xl font-semibold tracking-tight sm:text-3xl">{section.heading}</h2><div className="mt-4 space-y-4 text-base leading-8 text-on-surface-variant">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul className="space-y-3 rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-6">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><span className="material-symbols-outlined mt-1 text-[18px] text-tertiary">check_circle</span><span>{bullet}</span></li>)}</ul>}</div></section>)}</div>
        <div className="space-y-5 lg:sticky lg:top-28 lg:h-fit"><div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/55 p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-tertiary">OceanSkill</p><p className="mt-3 text-sm leading-6 text-on-surface-variant">{post.excerpt}</p></div></div>
      </div>
    </article>
    {related.length > 0 && <section className={`border-t border-outline-variant/25 bg-surface-container-lowest/45 py-16 ${readOnly ? "pointer-events-none" : ""}`}><div className="mx-auto max-w-7xl px-6 lg:px-8"><h2 className="font-geist text-3xl font-bold">{labels.relatedTitle}</h2><p className="mt-2 text-on-surface-variant">{labels.relatedDescription}</p><div className="mt-8 grid gap-6 md:grid-cols-3">{related.map((item) => <BlogCard key={item.slug} post={item} locale={locale} readLabel={labels.readArticle} minuteLabel={labels.minuteRead}/>)}</div></div></section>}
  </SiteShell>;
}
