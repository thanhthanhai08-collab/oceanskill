import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";

export type CollectionDraft = Readonly<{id:string; collection_id:string|null; slug:string; name_en:string; name_vi:string; description_en:string; description_vi:string; accent:"primary"|"secondary"|"tertiary"; skill_ids:string[]; status:"review"|"published"; updated_at:string}>;
export type PlatformCollectionAdmin = Readonly<{id:string; slug:string; name:string; description:string; accent:"primary"|"secondary"|"tertiary"; skill_ids:string[]}>;
export type CatalogSkillOption = Readonly<{id:string; slug:string; title:string}>;
export type BlogDraft = Readonly<{id:string; published_slug:string|null; slug:string; title_en:string; title_vi:string; excerpt_en:string; excerpt_vi:string; content_en:string; content_vi:string; category:string; author_name:string; icon:string; reading_minutes:number; status:"review"|"published"; updated_at:string}>;
export type PublishedBlogAdmin = Readonly<{slug:string; title_en:string; title_vi:string; excerpt_en:string; excerpt_vi:string; content_en:string; content_vi:string; category:string; author_name:string; icon:string; reading_minutes:number}>;

export async function listAdminCollectionContent() {
  const admin = createAdminClient();
  const [drafts, collections, skills] = await Promise.all([
    admin.from("platform_collection_drafts").select("id,collection_id,slug,name_en,name_vi,description_en,description_vi,accent,skill_ids,status,updated_at").order("updated_at", {ascending:false}),
    admin.from("skill_collections").select("id,slug,name,description,accent,skill_collection_items(skill_id,position)").eq("collection_type", "platform").order("updated_at", {ascending:false}),
    admin.from("skills").select("id,slug,title").eq("status","active").eq("visibility","public").order("title"),
  ]);
  if (drafts.error) throw drafts.error; if (collections.error) throw collections.error; if (skills.error) throw skills.error;
  return {
    drafts: (drafts.data ?? []) as CollectionDraft[],
    collections: (collections.data ?? []).map((row) => ({id:row.id, slug:row.slug, name:row.name, description:row.description, accent:row.accent, skill_ids:[...(row.skill_collection_items ?? [])].sort((a,b)=>a.position-b.position).map((item)=>item.skill_id)})) as PlatformCollectionAdmin[],
    skills: (skills.data ?? []) as CatalogSkillOption[],
  };
}

export async function getCollectionDraft(id:string) {
  const admin=createAdminClient(); const {data,error}=await admin.from("platform_collection_drafts").select("id,collection_id,slug,name_en,name_vi,description_en,description_vi,accent,skill_ids,status,updated_at").eq("id",id).maybeSingle();
  if(error) throw error; return data as CollectionDraft|null;
}

export async function listAdminBlogContent() {
  const admin=createAdminClient();
  const [drafts, posts]=await Promise.all([
    admin.from("blog_post_drafts").select("id,published_slug,slug,title_en,title_vi,excerpt_en,excerpt_vi,content_en,content_vi,category,author_name,icon,reading_minutes,status,updated_at").order("updated_at",{ascending:false}),
    admin.from("blog_posts").select("slug,locale,title,excerpt,content_markdown,category,author_name,icon,reading_minutes").eq("status","published").order("published_at",{ascending:false}),
  ]);
  if(drafts.error) throw drafts.error; if(posts.error) throw posts.error;
  const grouped=new Map<string, PublishedBlogAdmin>();
  for(const row of posts.data ?? []) { const old=grouped.get(row.slug); grouped.set(row.slug,{slug:row.slug,title_en:row.locale==="en"?row.title:old?.title_en??"",title_vi:row.locale==="vi"?row.title:old?.title_vi??"",excerpt_en:row.locale==="en"?(row.excerpt??""):old?.excerpt_en??"",excerpt_vi:row.locale==="vi"?(row.excerpt??""):old?.excerpt_vi??"",content_en:row.locale==="en"?(row.content_markdown??""):old?.content_en??"",content_vi:row.locale==="vi"?(row.content_markdown??""):old?.content_vi??"",category:row.category??old?.category??"Guide",author_name:row.author_name??old?.author_name??"OceanSkill",icon:row.icon??old?.icon??"article",reading_minutes:row.reading_minutes??old?.reading_minutes??5}); }
  return {drafts:(drafts.data??[]) as BlogDraft[], posts:[...grouped.values()]};
}

export async function getBlogDraft(id:string) { const admin=createAdminClient(); const {data,error}=await admin.from("blog_post_drafts").select("id,published_slug,slug,title_en,title_vi,excerpt_en,excerpt_vi,content_en,content_vi,category,author_name,icon,reading_minutes,status,updated_at").eq("id",id).maybeSingle(); if(error) throw error; return data as BlogDraft|null; }
