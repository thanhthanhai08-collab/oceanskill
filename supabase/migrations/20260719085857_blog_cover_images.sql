begin;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-assets',
  'blog-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.blog_posts
  add column if not exists cover_image_path text
  check (cover_image_path is null or cover_image_path ~ '^blog/[a-z0-9][a-z0-9._/-]{2,500}$');

alter table public.blog_post_drafts
  add column if not exists cover_image_path text
  check (cover_image_path is null or cover_image_path ~ '^blog/[a-z0-9][a-z0-9._/-]{2,500}$');

create or replace function public.publish_blog_post_draft(p_draft_id uuid, p_actor_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_draft public.blog_post_drafts%rowtype;
begin
  if not exists (select 1 from public.platform_skill_admins where user_id = p_actor_id) then
    raise exception using errcode = '42501', message = 'platform_admin_required';
  end if;
  select * into v_draft from public.blog_post_drafts where id = p_draft_id and status = 'review' for update;
  if not found then raise exception 'blog_draft_not_reviewable'; end if;
  if exists (
    select 1 from public.blog_posts
    where slug = v_draft.slug and v_draft.published_slug is distinct from v_draft.slug
  ) then raise exception 'blog_slug_exists'; end if;
  if v_draft.cover_image_path is not null and not exists (
    select 1 from storage.objects
    where bucket_id = 'blog-assets' and name = v_draft.cover_image_path
  ) then raise exception 'blog_cover_not_found'; end if;
  if v_draft.published_slug is not null and v_draft.published_slug <> v_draft.slug then
    delete from public.blog_posts where slug = v_draft.published_slug;
  end if;
  insert into public.blog_posts(slug, locale, title, excerpt, category, author_name, icon, reading_minutes, sections, content_markdown, cover_image_path, status, published_at)
  values
    (v_draft.slug, 'en', v_draft.title_en, v_draft.excerpt_en, v_draft.category, v_draft.author_name, v_draft.icon, v_draft.reading_minutes, '[]'::jsonb, v_draft.content_en, v_draft.cover_image_path, 'published', now()),
    (v_draft.slug, 'vi', v_draft.title_vi, v_draft.excerpt_vi, v_draft.category, v_draft.author_name, v_draft.icon, v_draft.reading_minutes, '[]'::jsonb, v_draft.content_vi, v_draft.cover_image_path, 'published', now())
  on conflict (slug, locale) do update set title = excluded.title, excerpt = excluded.excerpt,
    category = excluded.category, author_name = excluded.author_name, icon = excluded.icon,
    reading_minutes = excluded.reading_minutes, sections = excluded.sections,
    content_markdown = excluded.content_markdown, cover_image_path = excluded.cover_image_path,
    status = 'published', published_at = now(), updated_at = now();
  update public.blog_post_drafts set published_slug = slug, status = 'published' where id = p_draft_id;
  return v_draft.slug;
end;
$$;

revoke all on function public.publish_blog_post_draft(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_blog_post_draft(uuid, uuid) to service_role;

commit;
