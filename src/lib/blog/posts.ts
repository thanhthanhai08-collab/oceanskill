import "server-only";
import type {Locale} from "@/i18n/locales";
import {getBlogPost as getLocalBlogPost, getBlogPosts as getLocalBlogPosts, getRelatedPosts as getLocalRelatedPosts, type BlogPost, type BlogSection} from "@/content/blog";
import {createClient} from "@/lib/supabase/server";

type BlogPostRow = {
  slug: string;
  locale: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  author_name: string | null;
  icon: string | null;
  glow_class: string | null;
  reading_minutes: number | null;
  sections: unknown;
  published_at: string | null;
  updated_at: string | null;
};

function isSection(value: unknown): value is BlogSection {
  if (!value || typeof value !== "object") return false;
  const section = value as {heading?: unknown; paragraphs?: unknown; bullets?: unknown};
  return typeof section.heading === "string" && Array.isArray(section.paragraphs) && section.paragraphs.every((item) => typeof item === "string") && (section.bullets === undefined || (Array.isArray(section.bullets) && section.bullets.every((item) => typeof item === "string")));
}

function mapRow(row: BlogPostRow): BlogPost {
  const sections = Array.isArray(row.sections) ? row.sections.filter(isSection) : [];
  return {
    slug: row.slug,
    category: row.category ?? "Guide",
    publishedAt: row.published_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.published_at ?? new Date().toISOString(),
    readingMinutes: Number(row.reading_minutes ?? 5),
    author: row.author_name ?? "OceanSkill",
    icon: row.icon ?? "article",
    glowClass: row.glow_class ?? "from-primary-container/70 via-tertiary-container/30 to-background",
    title: row.title,
    excerpt: row.excerpt ?? "",
    sections,
  };
}

export async function getBlogPosts(locale: Locale): Promise<BlogPost[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("blog_posts")
    .select("slug,locale,title,excerpt,category,author_name,icon,glow_class,reading_minutes,sections,published_at,updated_at")
    .eq("locale", locale)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", {ascending: false});

  if (error || !data?.length) return getLocalBlogPosts(locale);
  const posts = (data as BlogPostRow[]).map(mapRow).filter((post) => post.sections.length > 0);
  return posts.length ? posts : getLocalBlogPosts(locale);
}

export async function getBlogPost(slug: string, locale: Locale): Promise<BlogPost | null> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("blog_posts")
    .select("slug,locale,title,excerpt,category,author_name,icon,glow_class,reading_minutes,sections,published_at,updated_at")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (!error && data) {
    const post = mapRow(data as BlogPostRow);
    if (post.sections.length > 0) return post;
  }

  return getLocalBlogPost(slug, locale);
}

export async function getRelatedPosts(post: BlogPost, locale: Locale, limit = 3): Promise<BlogPost[]> {
  const posts = await getBlogPosts(locale);
  const related = posts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, limit);

  return related.length ? related : getLocalRelatedPosts(post, locale, limit);
}
