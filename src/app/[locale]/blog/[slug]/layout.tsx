import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import {getBlogPost} from "@/content/blog";
import type {Locale} from "@/i18n/locales";
import {articleSchema, breadcrumbSchema} from "@/lib/seo/schema";
import {createPageMetadata, localizedUrl} from "@/lib/seo/site";

export interface BlogDetailLayoutProps { readonly children: React.ReactNode; readonly params: Promise<{locale: string; slug: string}>; }

export async function generateMetadata({params}: BlogDetailLayoutProps): Promise<Metadata> {
  const {locale, slug} = await params;
  const post = getBlogPost(slug, locale as Locale);
  if (!post) return {title: "OceanSkill Blog", robots: {index: false, follow: false}};
  return createPageMetadata({locale: locale as Locale, path: `blog/${slug}`, title: post.title, description: post.excerpt, type: "article"});
}

export default async function BlogDetailLayout({children, params}: BlogDetailLayoutProps) {
  const {locale, slug} = await params;
  const code = locale as Locale;
  const post = getBlogPost(slug, code);
  if (!post) return children;
  const seo = await getTranslations({locale, namespace: "SEO"});
  const url = localizedUrl(code, `blog/${slug}`);
  return <><JsonLd data={[breadcrumbSchema([{name: seo("homeBreadcrumb"), url: localizedUrl(code)}, {name: seo("blogBreadcrumb"), url: localizedUrl(code, "blog")}, {name: post.title, url}]), articleSchema({headline: post.title, description: post.excerpt, url, author: post.author, publishedAt: post.publishedAt, updatedAt: post.updatedAt, locale: code, category: post.category})]} />{children}</>;
}
