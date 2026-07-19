begin;

create table public.platform_collection_drafts (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.skill_collections(id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  name_en text not null check (char_length(name_en) between 1 and 120),
  name_vi text not null check (char_length(name_vi) between 1 and 120),
  description_en text not null check (char_length(description_en) <= 500),
  description_vi text not null check (char_length(description_vi) <= 500),
  accent text not null default 'primary' check (accent in ('primary', 'secondary', 'tertiary')),
  skill_ids uuid[] not null check (cardinality(skill_ids) between 1 and 100),
  status text not null default 'review' check (status in ('review', 'published')),
  created_by uuid not null references public.platform_skill_admins(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index platform_collection_drafts_review_collection_key
  on public.platform_collection_drafts(collection_id) where status = 'review' and collection_id is not null;
create index platform_collection_drafts_status_updated_idx
  on public.platform_collection_drafts(status, updated_at desc);
create index platform_collection_drafts_collection_idx on public.platform_collection_drafts(collection_id);
create index platform_collection_drafts_created_by_idx on public.platform_collection_drafts(created_by);

create table public.blog_post_drafts (
  id uuid primary key default gen_random_uuid(),
  published_slug text,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_en text not null check (char_length(title_en) between 1 and 220),
  title_vi text not null check (char_length(title_vi) between 1 and 220),
  excerpt_en text not null check (char_length(excerpt_en) <= 600),
  excerpt_vi text not null check (char_length(excerpt_vi) <= 600),
  content_en text not null check (char_length(content_en) between 1 and 100000),
  content_vi text not null check (char_length(content_vi) between 1 and 100000),
  category text not null default 'Guide' check (char_length(category) between 1 and 80),
  author_name text not null default 'OceanSkill' check (char_length(author_name) between 1 and 120),
  icon text not null default 'article' check (char_length(icon) between 1 and 80),
  reading_minutes integer not null default 5 check (reading_minutes between 1 and 180),
  status text not null default 'review' check (status in ('review', 'published')),
  created_by uuid not null references public.platform_skill_admins(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index blog_post_drafts_review_slug_key on public.blog_post_drafts(slug) where status = 'review';
create unique index blog_post_drafts_review_published_slug_key on public.blog_post_drafts(published_slug) where status = 'review' and published_slug is not null;
create index blog_post_drafts_status_updated_idx on public.blog_post_drafts(status, updated_at desc);
create index blog_post_drafts_created_by_idx on public.blog_post_drafts(created_by);

alter table public.blog_posts
  add column content_markdown text not null default '' check (char_length(content_markdown) <= 100000);

drop trigger if exists platform_collection_drafts_set_updated_at on public.platform_collection_drafts;
create trigger platform_collection_drafts_set_updated_at before update on public.platform_collection_drafts
for each row execute function private.set_updated_at();
drop trigger if exists blog_post_drafts_set_updated_at on public.blog_post_drafts;
create trigger blog_post_drafts_set_updated_at before update on public.blog_post_drafts
for each row execute function private.set_updated_at();

alter table public.platform_collection_drafts enable row level security;
alter table public.blog_post_drafts enable row level security;
revoke all on public.platform_collection_drafts, public.blog_post_drafts from public, anon, authenticated;
grant all on public.platform_collection_drafts, public.blog_post_drafts to service_role;

create or replace function public.publish_platform_collection_draft(p_draft_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_draft public.platform_collection_drafts%rowtype;
  v_collection_id uuid;
begin
  if not exists (select 1 from public.platform_skill_admins where user_id = p_actor_id) then
    raise exception using errcode = '42501', message = 'platform_admin_required';
  end if;
  select * into v_draft from public.platform_collection_drafts where id = p_draft_id and status = 'review' for update;
  if not found then raise exception 'collection_draft_not_reviewable'; end if;
  if cardinality(v_draft.skill_ids) <> cardinality(array(select distinct unnest(v_draft.skill_ids))) then
    raise exception 'duplicate_collection_skills';
  end if;
  if exists (
    select 1 from unnest(v_draft.skill_ids) requested(id)
    where not exists (select 1 from public.skills s where s.id = requested.id and s.status = 'active' and s.visibility = 'public')
  ) then raise exception 'collection_skill_not_public'; end if;

  if v_draft.collection_id is null then
    insert into public.skill_collections(user_id, name, slug, description, accent, visibility, collection_type)
    values (null, v_draft.name_en, v_draft.slug, v_draft.description_en, v_draft.accent, 'public', 'platform')
    returning id into v_collection_id;
  else
    update public.skill_collections set name = v_draft.name_en, slug = v_draft.slug,
      description = v_draft.description_en, accent = v_draft.accent, updated_at = now()
    where id = v_draft.collection_id and collection_type = 'platform'
    returning id into v_collection_id;
    if v_collection_id is null then raise exception 'platform_collection_not_found'; end if;
  end if;

  insert into public.skill_collection_translations(collection_id, locale, name, description)
  values (v_collection_id, 'en', v_draft.name_en, v_draft.description_en),
         (v_collection_id, 'vi', v_draft.name_vi, v_draft.description_vi)
  on conflict (collection_id, locale) do update set name = excluded.name, description = excluded.description, updated_at = now();
  delete from public.skill_collection_items where collection_id = v_collection_id;
  insert into public.skill_collection_items(collection_id, skill_id, position)
  select v_collection_id, id, ordinality - 1 from unnest(v_draft.skill_ids) with ordinality selected(id, ordinality);
  update public.platform_collection_drafts set collection_id = v_collection_id, status = 'published' where id = p_draft_id;
  return v_collection_id;
end;
$$;

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
  if v_draft.published_slug is not null and v_draft.published_slug <> v_draft.slug then
    delete from public.blog_posts where slug = v_draft.published_slug;
  end if;
  insert into public.blog_posts(slug, locale, title, excerpt, category, author_name, icon, reading_minutes, sections, content_markdown, status, published_at)
  values
    (v_draft.slug, 'en', v_draft.title_en, v_draft.excerpt_en, v_draft.category, v_draft.author_name, v_draft.icon, v_draft.reading_minutes, '[]'::jsonb, v_draft.content_en, 'published', now()),
    (v_draft.slug, 'vi', v_draft.title_vi, v_draft.excerpt_vi, v_draft.category, v_draft.author_name, v_draft.icon, v_draft.reading_minutes, '[]'::jsonb, v_draft.content_vi, 'published', now())
  on conflict (slug, locale) do update set title = excluded.title, excerpt = excluded.excerpt,
    category = excluded.category, author_name = excluded.author_name, icon = excluded.icon,
    reading_minutes = excluded.reading_minutes, sections = excluded.sections,
    content_markdown = excluded.content_markdown, status = 'published', published_at = now(), updated_at = now();
  update public.blog_post_drafts set published_slug = slug, status = 'published' where id = p_draft_id;
  return v_draft.slug;
end;
$$;

revoke all on function public.publish_platform_collection_draft(uuid, uuid) from public, anon, authenticated;
revoke all on function public.publish_blog_post_draft(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_platform_collection_draft(uuid, uuid) to service_role;
grant execute on function public.publish_blog_post_draft(uuid, uuid) to service_role;

commit;
