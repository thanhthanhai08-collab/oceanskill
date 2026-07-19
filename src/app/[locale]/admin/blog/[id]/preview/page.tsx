import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import Link from "next/link";
import {notFound} from "next/navigation";
import BlogArticleView from "@/components/blog/BlogArticleView";
import type {BlogPost} from "@/content/blog";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {getBlogDraft} from "@/lib/admin/content";
import {blogCoverPublicUrl} from "@/lib/blog/covers";
import type {Locale} from "@/i18n/locales";
import {getRelatedPosts} from "@/lib/blog/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function BlogPreview({params}: {params: Promise<{locale: string; id: string}>}) {
  const {locale, id} = await params;
  if (!await getPlatformAdmin()) notFound();
  const draft = await getBlogDraft(id);
  if (!draft || draft.status !== "review") notFound();
  const vi = locale === "vi";
  const t = await getTranslations({locale, namespace: "Blog"});
  const post: BlogPost = {
    slug: draft.slug,
    category: draft.category,
    publishedAt: draft.updated_at,
    updatedAt: draft.updated_at,
    readingMinutes: draft.reading_minutes,
    author: draft.author_name,
    icon: "article",
    glowClass: "",
    title: vi ? draft.title_vi : draft.title_en,
    excerpt: vi ? draft.excerpt_vi : draft.excerpt_en,
    sections: [],
    contentMarkdown: vi ? draft.content_vi : draft.content_en,
    coverImagePath: draft.cover_image_path,
    coverImageUrl: blogCoverPublicUrl(draft.cover_image_path),
  };
  const related = await getRelatedPosts(post, locale as Locale);
  const banner = <div className="sticky top-0 z-50 border-b border-secondary/25 bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3"><Link href={`/${locale}/admin/blog`} className="text-sm font-semibold text-primary">← {vi ? "Quay lại quản trị" : "Back to admin"}</Link><span className="rounded-full bg-secondary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-secondary">Preview · noindex</span></div></div>;
  return <BlogArticleView post={post} related={related} locale={locale} readOnly adminBanner={banner} labels={{back: t("back"), minuteRead: t("minuteRead"), by: t("by"), published: t("published"), save: t("save"), saved: t("saved"), relatedTitle: t("relatedTitle"), relatedDescription: t("relatedDescription"), readArticle: t("readArticle")}}/>;
}
