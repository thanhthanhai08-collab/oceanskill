import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";
import BlogArticleView from "@/components/blog/BlogArticleView";
import {getBlogSlugs} from "@/content/blog";
import type {Locale} from "@/i18n/locales";
import {getBlogPost, getRelatedPosts} from "@/lib/blog/posts";

export interface BlogDetailPageProps { readonly params: Promise<{locale: string; slug: string}>; }
export function generateStaticParams() { return getBlogSlugs().map((slug) => ({slug})); }

export default async function BlogDetailPage({params}: BlogDetailPageProps) {
  const {locale, slug} = await params;
  const code = locale as Locale;
  const post = await getBlogPost(slug, code);
  if (!post) notFound();
  const t = await getTranslations({locale, namespace: "Blog"});
  const related = await getRelatedPosts(post, code);
  return <BlogArticleView post={post} related={related} locale={locale} labels={{back: t("back"), minuteRead: t("minuteRead"), by: t("by"), published: t("published"), save: t("save"), saved: t("saved"), relatedTitle: t("relatedTitle"), relatedDescription: t("relatedDescription"), readArticle: t("readArticle")}}/>;
}
