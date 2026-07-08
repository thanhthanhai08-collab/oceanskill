import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import BlogCard from "@/components/blog/BlogCard";
import AdSlot from "@/components/ads/AdSlot";
import type {Locale} from "@/i18n/locales";
import {getBlogPosts} from "@/lib/blog/posts";

export interface BlogPageProps { readonly params: Promise<{locale: string}>; }

export default async function BlogPage({params}: BlogPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Blog"});
  const posts = await getBlogPosts(locale as Locale);
  return <SiteShell><section className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("eyebrow")}</p><h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-6xl">{t("title")}</h1><p className="mt-5 text-lg leading-8 text-on-surface-variant">{t("description")}</p></div><AdSlot label={t("advertisement")} className="mt-10"/><div className="mt-14 flex items-end justify-between"><div><p className="font-mono text-xs uppercase tracking-wider text-secondary">{t("featured")}</p><h2 className="mt-2 font-geist text-2xl font-semibold">{t("allArticles")}</h2></div><span className="font-mono text-xs text-on-surface-variant">{posts.length}</span></div><div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.slug} post={post} locale={locale} readLabel={t("readArticle")} minuteLabel={t("minuteRead")} />)}</div></section></SiteShell>;
}
