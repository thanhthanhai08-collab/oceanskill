import {getLocale, getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import BlogCard from "@/components/blog/BlogCard";
import type {Locale} from "@/i18n/locales";
import {getBlogPosts} from "@/lib/blog/posts";

export default async function KnowledgeHub() {
  const [locale, home, blog] = await Promise.all([getLocale(), getTranslations("Home"), getTranslations("Blog")]);
  const posts = (await getBlogPosts(locale as Locale)).slice(0, 2);
  return (
    <section className="border-b border-outline-variant/35 bg-surface-container-lowest/55 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8"><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">{home("knowledgeEyebrow")}</p><h2 className="mt-5 text-balance font-geist text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{home("knowledgeTitle")}</h2><p className="mt-4 max-w-2xl leading-7 text-on-surface-variant">{home("knowledgeSubtitle")}</p></div>
          <Link href="/blog" className="hidden text-right text-sm font-semibold text-primary underline decoration-outline-variant underline-offset-4 transition hover:decoration-primary sm:block lg:col-span-4">{home("openBlog")}</Link>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">{posts.map((post) => <BlogCard key={post.slug} post={post} locale={locale} readLabel={blog("readArticle")} minuteLabel={blog("minuteRead")} />)}</div>
          <Link href="/faq" className="group relative flex min-h-96 flex-col overflow-hidden border border-primary/45 bg-primary/[.07] p-8 transition hover:border-primary lg:col-span-4">
            <span className="absolute -right-5 -top-8 font-geist text-9xl font-semibold tracking-[-0.08em] text-primary/[.08]">?</span>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">OceanGuide</p>
            <div className="mt-auto"><h3 className="text-balance font-geist text-3xl font-semibold tracking-tight">{home("chatbotCardTitle")}</h3><p className="mt-4 text-sm leading-6 text-on-surface-variant">{home("chatbotCardDescription")}</p><span className="mt-7 inline-flex items-center gap-1 text-sm font-semibold text-primary">{home("askOceanGuide")}<span className="material-symbols-outlined text-[18px] transition group-hover:translate-x-1">arrow_forward</span></span></div>
          </Link>
        </div>
      </div>
    </section>
  );
}
