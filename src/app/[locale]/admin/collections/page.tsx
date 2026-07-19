import type {Metadata} from "next";
import {notFound, redirect} from "next/navigation";
import AdminCollectionEditor from "@/components/admin/AdminCollectionEditor";
import AdminDisclosure from "@/components/admin/AdminDisclosure";
import AdminNav from "@/components/admin/AdminNav";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {listAdminCollectionContent} from "@/lib/admin/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function AdminCollectionsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!await getPlatformAdmin()) {
    const {createClient} = await import("@/lib/supabase/server");
    const {data: {user}} = await (await createClient()).auth.getUser();
    if (!user) redirect(`/${locale}/login?next=/${locale}/admin/collections`);
    notFound();
  }
  const {drafts, collections, skills} = await listAdminCollectionContent();
  const reviewDrafts = drafts.filter((draft) => draft.status === "review");
  const vi = locale === "vi";

  return <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10 sm:px-8">
    <AdminNav locale={locale} active="collections"/>
    <header><p className="font-mono text-xs uppercase tracking-[.2em] text-primary">Platform content</p><h1 className="mt-3 font-geist text-4xl font-bold">{vi ? "Bộ sưu tập nền tảng" : "Platform collections"}</h1><p className="mt-3 text-on-surface-variant">{vi ? "Tạo hoặc sửa trong bản nháp, xem trước rồi mới công khai lên kho skill." : "Create or edit a draft, preview it, then publish it to the skill catalog."}</p></header>

    <section className="mt-8"><AdminDisclosure title={vi ? "Tạo bộ sưu tập mới" : "Create a new collection"} meta={vi ? "Mở biểu mẫu tạo bản nháp" : "Open the draft form"} icon="create_new_folder"><AdminCollectionEditor locale={locale} skills={skills}/></AdminDisclosure></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><h2 className="font-geist text-2xl font-bold">{vi ? "Bản nháp" : "Drafts"}</h2><span className="font-mono text-xs text-on-surface-variant">{reviewDrafts.length}</span></div><div className="space-y-3">{reviewDrafts.map((draft) => <AdminDisclosure key={draft.id} title={vi ? draft.name_vi : draft.name_en} meta={`${draft.slug} · ${draft.skill_ids.length} skills`} icon="pending_actions" badge={<span className="hidden rounded-full bg-secondary/12 px-3 py-1 font-mono text-[10px] uppercase text-secondary sm:inline">Draft</span>}><AdminCollectionEditor locale={locale} skills={skills} draft={draft}/></AdminDisclosure>)}</div></section>

    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><h2 className="font-geist text-2xl font-bold">{vi ? "Đang hiển thị" : "Published"}</h2><span className="font-mono text-xs text-on-surface-variant">{collections.length}</span></div><div className="space-y-3">{collections.map((collection) => <AdminDisclosure key={collection.id} title={collection.name} meta={`${collection.slug} · ${collection.skill_ids.length} skills`} icon="folder_special" badge={<span className="hidden rounded-full bg-tertiary/12 px-3 py-1 font-mono text-[10px] uppercase text-tertiary sm:inline">Published</span>}><AdminCollectionEditor locale={locale} skills={skills} collection={collection}/></AdminDisclosure>)}</div></section>
  </main>;
}
