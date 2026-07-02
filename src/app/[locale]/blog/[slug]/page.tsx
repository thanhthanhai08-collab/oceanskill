import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";
import BlogCard from "@/components/blog/BlogCard";
import SaveArticleButton from "@/components/blog/SaveArticleButton";
import AdSlot from "@/components/ads/AdSlot";
import {getBlogPost, getBlogSlugs, getRelatedPosts} from "@/content/blog";
import type {Locale} from "@/i18n/locales";

export interface BlogDetailPageProps { readonly params: Promise<{locale: string; slug: string}>; }

export function generateStaticParams() { return getBlogSlugs().map((slug) => ({slug})); }

export default async function BlogDetailPage({params}: BlogDetailPageProps) {
  const {locale, slug} = await params;
  const code = locale as Locale;
  const post = getBlogPost(slug, code);
  if (!post) notFound();
  const t = await getTranslations({locale, namespace: "Blog"});
  const related = getRelatedPosts(post, code);
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "long"}).format(new Date(post.publishedAt));
  return <SiteShell><article><header className="border-b border-outline-variant/25"><div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16"><Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><span className="material-symbols-outlined text-[18px]">arrow_back</span>{t("back")}</Link><div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs text-on-surface-variant"><span className="rounded-full bg-tertiary/10 px-3 py-1 text-tertiary">{post.category}</span><span>{post.readingMinutes} {t("minuteRead")}</span></div><h1 className="mt-5 max-w-4xl font-geist text-4xl font-bold leading-tight tracking-tight sm:text-6xl">{post.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">{post.excerpt}</p><div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/30 pt-6"><p className="text-sm text-on-surface-variant">{t("by")} <span className="font-semibold text-on-surface">{post.author}</span> · {t("published")} <time dateTime={post.publishedAt}>{date}</time></p><SaveArticleButton slug={post.slug} saveLabel={t("save")} savedLabel={t("saved")} /></div></div></header><div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8"><div className="space-y-10">{post.sections.map((section, index) => <section key={section.heading}><h2 className="font-geist text-2xl font-semibold tracking-tight sm:text-3xl">{section.heading}</h2><div className="mt-4 space-y-4 text-base leading-8 text-on-surface-variant">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul className="space-y-3 rounded-2xl border border-outline-variant/35 bg-surface-container-low/50 p-6">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><span className="material-symbols-outlined mt-1 text-[18px] text-tertiary">check_circle</span><span>{bullet}</span></li>)}</ul>}</div>{index === 0 && <AdSlot label={t("inArticleAdvertisement")} format="in-article" className="mt-8"/>}</section>)}</div><div className="space-y-5 lg:sticky lg:top-28 lg:h-fit"><AdSlot label={t("advertisement")} format="rectangle"/><div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/55 p-5"><p className="font-mono text-[10px] uppercase tracking-wider text-tertiary">OceanSkill</p><p className="mt-3 text-sm leading-6 text-on-surface-variant">{post.excerpt}</p></div></div></div></article><section className="border-t border-outline-variant/25 bg-surface-container-lowest/45 py-16"><div className="mx-auto max-w-7xl px-6 lg:px-8"><h2 className="font-geist text-3xl font-bold">{t("relatedTitle")}</h2><p className="mt-2 text-on-surface-variant">{t("relatedDescription")}</p><div className="mt-8 grid gap-6 md:grid-cols-3">{related.map((item) => <BlogCard key={item.slug} post={item} locale={locale} readLabel={t("readArticle")} minuteLabel={t("minuteRead")} />)}</div></div></section></SiteShell>;
}
