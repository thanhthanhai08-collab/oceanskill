import type {Metadata} from "next";
import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import AdminAuthorManager from "@/components/admin/AdminAuthorManager";
import AdminNav from "@/components/admin/AdminNav";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {listPlatformAuthors} from "@/lib/skills/platform-authors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

const copy = {
  en: {
    eyebrow: "Platform identities", title: "Platform skill authors", description: "Create bilingual author drafts, edit their public profile, and publish only after review.", back: "Back to dashboard",
    labels: {createTitle: "Add an author", createDescription: "New authors are private drafts until you publish them.", authorId: "Author ID", name: "Display name", handle: "Handle", icon: "Material icon", category: "Category", glow: "Profile gradient", glow1: "Primary · secondary", glow2: "Secondary · tertiary", glow3: "Tertiary · primary", website: "Website URL", avatar: "Avatar URL", bio: "Biography", focus: "Focus areas (comma or line separated)", create: "Save author draft", creating: "Creating...", save: "Save edits", saving: "Saving...", publish: "Publish author", unpublish: "Return to draft", publishing: "Updating...", delete: "Delete", deleting: "Deleting...", confirmDelete: "Delete this author? This cannot be undone.", libraryEyebrow: "Author library", libraryTitle: "Draft and published authors", published: "Published", draft: "Draft", skills: "skills", author_created: "Author draft created.", author_updated: "Author updated.", author_published: "Author published.", author_unpublished: "Author returned to draft.", author_deleted: "Author deleted.", author_in_use: "This author is assigned to a skill and cannot be deleted.", author_id_exists: "This author ID already exists.", invalid_author_id: "Use a lowercase kebab-case author ID.", invalid_author_name: "Enter a valid author name.", invalid_author_metadata: "Handle or icon is invalid.", invalid_author_category: "Choose a valid category.", invalid_author_glow: "Choose an available gradient.", invalid_author_url: "URLs must use HTTPS.", invalid_author_bio: "Complete both biographies.", invalid_author_focus: "Complete focus areas in both languages.", invalid_author_translations: "Complete both language profiles before publishing.", author_not_found: "Author not found.", operation_failed: "Could not complete the operation."},
  },
  vi: {
    eyebrow: "Danh tính nền tảng", title: "Tác giả skill nền tảng", description: "Tạo bản nháp tác giả song ngữ, chỉnh sửa hồ sơ công khai và chỉ xuất bản sau khi duyệt.", back: "Về Dashboard",
    labels: {createTitle: "Thêm tác giả", createDescription: "Tác giả mới luôn ở trạng thái bản nháp riêng tư cho đến khi bạn xuất bản.", authorId: "Author ID", name: "Tên hiển thị", handle: "Handle", icon: "Material icon", category: "Danh mục", glow: "Gradient hồ sơ", glow1: "Primary · secondary", glow2: "Secondary · tertiary", glow3: "Tertiary · primary", website: "URL website", avatar: "URL ảnh đại diện", bio: "Tiểu sử", focus: "Lĩnh vực tập trung (phân tách bằng dấu phẩy hoặc xuống dòng)", create: "Lưu bản nháp tác giả", creating: "Đang tạo...", save: "Lưu chỉnh sửa", saving: "Đang lưu...", publish: "Xuất bản tác giả", unpublish: "Chuyển về bản nháp", publishing: "Đang cập nhật...", delete: "Xóa", deleting: "Đang xóa...", confirmDelete: "Xóa tác giả này? Thao tác không thể hoàn tác.", libraryEyebrow: "Kho tác giả", libraryTitle: "Tác giả bản nháp và đã xuất bản", published: "Đã xuất bản", draft: "Bản nháp", skills: "skill", author_created: "Đã tạo bản nháp tác giả.", author_updated: "Đã cập nhật tác giả.", author_published: "Đã xuất bản tác giả.", author_unpublished: "Đã chuyển tác giả về bản nháp.", author_deleted: "Đã xóa tác giả.", author_in_use: "Tác giả đang được gán cho skill nên không thể xóa.", author_id_exists: "Author ID này đã tồn tại.", invalid_author_id: "Author ID phải viết thường theo dạng kebab-case.", invalid_author_name: "Hãy nhập tên tác giả hợp lệ.", invalid_author_metadata: "Handle hoặc icon không hợp lệ.", invalid_author_category: "Hãy chọn danh mục hợp lệ.", invalid_author_glow: "Hãy chọn gradient có sẵn.", invalid_author_url: "URL phải dùng HTTPS.", invalid_author_bio: "Hãy nhập đủ tiểu sử hai ngôn ngữ.", invalid_author_focus: "Hãy nhập lĩnh vực tập trung bằng cả hai ngôn ngữ.", invalid_author_translations: "Hãy nhập đủ hồ sơ hai ngôn ngữ trước khi xuất bản.", author_not_found: "Không tìm thấy tác giả.", operation_failed: "Không thể hoàn tất thao tác."},
  },
} as const;

export default async function AdminAuthorsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const admin = await getPlatformAdmin();
  if (!admin) {
    const {createClient} = await import("@/lib/supabase/server");
    const {data: {user}} = await (await createClient()).auth.getUser();
    if (!user) redirect(`/${locale}/login?next=/${locale}/admin/authors`);
    notFound();
  }
  const code = locale === "vi" ? "vi" : "en";
  const authors = await listPlatformAuthors();
  const labels = copy[code];
  return <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
    <AdminNav locale={locale} active="authors"/>
    <div className="flex flex-wrap items-start justify-between gap-5"><header><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{labels.eyebrow}</p><h1 className="mt-3 font-geist text-4xl font-bold tracking-tight sm:text-5xl">{labels.title}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-on-surface-variant">{labels.description}</p></header><Link href={`/${locale}/dashboard`} className="min-h-11 rounded-xl border border-outline-variant/50 px-4 py-3 text-sm font-semibold">{labels.back}</Link></div>
    <div className="mt-9"><AdminAuthorManager authors={authors} labels={labels.labels}/></div>
  </main>;
}
