import type {Metadata} from "next";
import {notFound, redirect} from "next/navigation";
import AdminBlogEditor from "@/components/admin/AdminBlogEditor";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import AdminNav from "@/components/admin/AdminNav";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {listAdminBlogContent} from "@/lib/admin/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function AdminBlogPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!await getPlatformAdmin()) {
    const {createClient} = await import("@/lib/supabase/server");
    const {data: {user}} = await (await createClient()).auth.getUser();
    if (!user) redirect(`/${locale}/login?next=/${locale}/admin/blog`);
    notFound();
  }
  const {drafts, posts, covers} = await listAdminBlogContent();
  const reviewDrafts = drafts.filter((draft) => draft.status === "review");
  const vi = locale === "vi";

  return <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10 sm:px-8">
    <AdminNav locale={locale} active="blog"/>
    <header><p className="font-mono text-xs uppercase tracking-[.2em] text-primary">Editorial</p><h1 className="mt-3 font-geist text-4xl font-bold">{vi ? "Quản trị blog" : "Blog publishing"}</h1><p className="mt-3 text-on-surface-variant">{vi ? "Viết song ngữ bằng Markdown, chọn ảnh bìa từ Storage và xem đúng giao diện thật trước khi đăng." : "Write bilingual Markdown, choose a Storage cover, and preview the real article layout before publishing."}</p></header>

    <section className="mt-8"><AdminDisclosure title={vi ? "Viết bài mới" : "Create a new post"} meta={vi ? "Mở trình soạn bài song ngữ" : "Open the bilingual editor"} icon="post_add"><AdminBlogEditor locale={locale} covers={covers}/></AdminDisclosure></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><h2 className="font-geist text-2xl font-bold">Drafts</h2><span className="font-mono text-xs text-on-surface-variant">{reviewDrafts.length}</span></div><div className="space-y-3">{reviewDrafts.map((draft) => <AdminDisclosure key={draft.id} title={vi ? draft.title_vi : draft.title_en} meta={`${draft.slug} · ${draft.reading_minutes} min`} icon="draft" badge={<span className="hidden rounded-full bg-secondary/12 px-3 py-1 font-mono text-[10px] uppercase text-secondary sm:inline">Draft</span>}><AdminBlogEditor locale={locale} covers={covers} draft={draft}/></AdminDisclosure>)}</div></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><h2 className="font-geist text-2xl font-bold">Published</h2><span className="font-mono text-xs text-on-surface-variant">{posts.length}</span></div><div className="space-y-3">{posts.map((post) => <AdminDisclosure key={post.slug} title={vi ? post.title_vi : post.title_en} meta={`${post.slug} · ${post.reading_minutes} min`} icon="article" badge={<span className="hidden rounded-full bg-tertiary/12 px-3 py-1 font-mono text-[10px] uppercase text-tertiary sm:inline">Published</span>}><AdminBlogEditor locale={locale} covers={covers} post={post}/></AdminDisclosure>)}</div></section>
  </main>;
}
