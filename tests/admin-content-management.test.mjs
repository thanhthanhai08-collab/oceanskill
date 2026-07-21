import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migration = new URL("../supabase/migrations/20260719040940_admin_collections_and_blog_markdown.sql", import.meta.url);
const blogCoverMigration = new URL("../supabase/migrations/20260719085857_blog_cover_images.sql", import.meta.url);
const blogCoverConstraintFix = new URL("../supabase/migrations/20260719120133_fix_blog_cover_path_check.sql", import.meta.url);

test("admin collection and blog drafts stay private until transactional publish", async () => {
  const sql = await readFile(migration, "utf8");
  for (const table of ["platform_collection_drafts", "blog_post_drafts"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /revoke all on public\.platform_collection_drafts, public\.blog_post_drafts from public, anon, authenticated/i);
  assert.match(sql, /publish_platform_collection_draft[\s\S]+status = 'active'[\s\S]+visibility = 'public'/i);
  assert.match(sql, /publish_blog_post_draft[\s\S]+status = 'published'/i);
  assert.match(sql, /grant execute on function public\.publish_platform_collection_draft\(uuid, uuid\) to service_role/i);
  assert.match(sql, /grant execute on function public\.publish_blog_post_draft\(uuid, uuid\) to service_role/i);
});

test("Gemini uses 2.5 Flash and previews share safe public renderers", async () => {
  const [gemini, markdown, publicBlog, articleView, skillPreview, collectionPreview, blogPreview] = await Promise.all([
    readFile(new URL("../src/lib/skills/gemini-metadata.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/blog/MarkdownArticle.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/blog/BlogArticleView.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/skills/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/collections/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/blog/[id]/preview/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(gemini, /gemini-2\.5-flash/);
  assert.match(markdown, /"h2" \| "h3" \| "h4"/);
  assert.match(markdown, /<table>/);
  assert.match(markdown, /<br\/>/);
  assert.doesNotMatch(markdown, /dangerouslySetInnerHTML/);
  assert.match(publicBlog, /BlogArticleView/);
  assert.match(articleView, /MarkdownArticle/);
  assert.match(blogPreview, /BlogArticleView/);
  for (const preview of [skillPreview, collectionPreview, blogPreview]) {
    assert.match(preview, /getPlatformAdmin\(\)/);
    assert.match(preview, /index:\s*false/);
  }
});

test("blog covers come from a constrained public Storage prefix and replace decorative post icons", async () => {
  const [sql, constraintFix, card, actions, editor, publicPosts] = await Promise.all([
    readFile(blogCoverMigration, "utf8"),
    readFile(blogCoverConstraintFix, "utf8"),
    readFile(new URL("../src/components/blog/BlogCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/blog/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/admin/AdminBlogEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/blog/posts.ts", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /'blog-assets'[\s\S]+true[\s\S]+5242880/i);
  assert.match(sql, /array\['image\/jpeg', 'image\/png', 'image\/webp', 'image\/avif'\]/i);
  assert.match(sql, /cover_image_path[\s\S]+\^blog\//i);
  assert.match(sql, /storage\.objects[\s\S]+bucket_id = 'blog-assets'/i);
  assert.match(constraintFix, /length\(cover_image_path\) between 6 and 505/i);
  assert.doesNotMatch(constraintFix, /\{2,500\}/);
  assert.doesNotMatch(card, /post\.icon|post\.glowClass/);
  assert.match(card, /aspect-video/);
  assert.match(actions, /detectImage/);
  assert.match(actions, /maxCoverBytes/);
  assert.match(actions, /sharp\(bytes/);
  assert.match(actions, /\.webp\(\{quality: 82, effort: 4\}\)/);
  assert.match(actions, /blog\/\$\{postSlug\}-\$\{crypto\.randomUUID\(\)\}\.webp/);
  assert.match(actions, /contentType: "image\/webp"/);
  assert.doesNotMatch(editor, /Material icon/);
  assert.match(editor, /coverFile/);
  assert.match(publicPosts, /cover_image_path/);
});

test("admin previews render through protected production routes with related content", async () => {
  const [blogPreview, skillPreview, collectionPreview, publicSkill, publicCollection, skillEditor, collectionEditor] = await Promise.all([
    readFile(new URL("../src/app/[locale]/admin/blog/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/skills/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/collections/[id]/preview/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/skills/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/skills/collections/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/admin/AdminSkillDraftCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/admin/AdminCollectionEditor.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(blogPreview, /getRelatedPosts\(post/);
  assert.match(blogPreview, /related=\{related\}/);
  assert.match(blogPreview, /readOnly/);
  for (const page of [publicSkill, publicCollection]) {
    assert.match(page, /getPlatformAdmin\(\)/);
    assert.match(page, /robots: \{index: false, follow: false\}/);
    assert.match(page, /pointer-events-none/);
  }
  assert.match(skillPreview, /redirect\(`\/\$\{locale\}\/skills\/\$\{draft\.skills\.slug\}\?preview=/);
  assert.match(collectionPreview, /redirect\(`\/\$\{locale\}\/skills\/collections\/\$\{draft\.slug\}\?preview=/);
  assert.match(skillEditor, /\/skills\/\$\{draft\.skills\?\.slug/);
  assert.match(collectionEditor, /\/skills\/collections\/\$\{draft\.slug\}\?preview=/);
});

test("admin content lists stay compact until an administrator expands an editor", async () => {
  const [disclosure, skills, collections, blog, dashboard, viDashboard, enDashboard] = await Promise.all([
    readFile(new URL("../src/components/admin/AdminDisclosure.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/skills/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/collections/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/admin/blog/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../messages/vi/dashboard.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/en/dashboard.json", import.meta.url), "utf8"),
  ]);
  assert.match(disclosure, /<details/);
  assert.match(disclosure, /<summary/);
  for (const page of [skills, collections, blog]) assert.match(page, /AdminDisclosure/);
  assert.match(skills, /reviewDrafts/);
  assert.match(collections, /collections\.map/);
  assert.match(blog, /posts\.map/);
  assert.match(dashboard, /getPlatformAdmin\(\)/);
  assert.match(dashboard, /platformAdmin && <Link href="\/admin\/skills"/);
  assert.match(viDashboard, /Quản trị nền tảng/);
  assert.match(enDashboard, /Platform administration/);
});

test("platform and private skill uploads accept ZIP and RAR without weakening archive checks", async () => {
  const [form, versionForm, creatorForm, packageSource, nextConfig, viAdmin, enAdmin] = await Promise.all([
    readFile(new URL("../src/components/admin/AdminSkillUploadForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/admin/AdminNewVersionForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/dashboard/CreatorSkillForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/skills/package.ts", import.meta.url), "utf8"),
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../messages/vi/admin.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/en/admin.json", import.meta.url), "utf8"),
  ]);

  for (const uploadForm of [form, versionForm, creatorForm]) {
    assert.match(uploadForm, /accept="\.zip,\.rar,/);
  }
  assert.match(form, /code === "invalid_bundle_type"[\s\S]+labels\.errorArchiveType/);
  assert.match(packageSource, /hasRarSignature/);
  assert.match(packageSource, /createExtractorFromData/);
  assert.match(packageSource, /headerEncrypted/);
  assert.match(packageSource, /maxCompressionRatio/);
  assert.match(packageSource, /maxExpandedBytes/);
  assert.match(packageSource, /rarExtractionQueue/);
  assert.match(nextConfig, /serverExternalPackages: \["node-unrar-js"\]/);
  assert.match(viAdmin, /"errorArchiveType"/);
  assert.match(enAdmin, /"errorArchiveType"/);
});
