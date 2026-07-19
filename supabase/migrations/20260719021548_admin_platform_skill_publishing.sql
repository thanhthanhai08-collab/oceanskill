begin;

create table if not exists public.platform_skill_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_skill_admins enable row level security;
drop policy if exists platform_skill_admins_select_self on public.platform_skill_admins;
create policy platform_skill_admins_select_self
on public.platform_skill_admins for select to authenticated
using ((select auth.uid()) = user_id);
revoke all on public.platform_skill_admins from public, anon, authenticated;
grant select (user_id) on public.platform_skill_admins to authenticated;

insert into public.platform_skill_admins (user_id)
select id
from auth.users
where id = '670e620b-5a53-461e-9515-a6ba505817e6'
  and lower(email) = 'thanhthanhai08@gmail.com'
on conflict (user_id) do nothing;

do $$
begin
  if not exists (
    select 1 from public.platform_skill_admins
    where user_id = '670e620b-5a53-461e-9515-a6ba505817e6'
  ) then
    raise exception 'configured_platform_admin_not_found';
  end if;
end;
$$;

drop function if exists public.is_platform_skill_admin();

create table if not exists public.platform_skill_drafts (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  skill_version_id uuid not null unique references public.skill_versions(id) on delete cascade,
  version text not null check (version ~ '^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$'),
  title_en text not null check (char_length(title_en) between 2 and 160),
  title_vi text not null check (char_length(title_vi) between 2 and 160),
  description_en text not null check (char_length(description_en) between 10 and 800),
  description_vi text not null check (char_length(description_vi) between 10 and 800),
  category text not null references public.categories(slug) on update cascade,
  compatible_clients text[] not null check (
    cardinality(compatible_clients) between 1 and 4
    and compatible_clients <@ array['codex','claude-code','cursor','generic-mcp']::text[]
  ),
  source_url text check (source_url is null or source_url ~ '^https://'),
  license_spdx text check (license_spdx is null or char_length(license_spdx) between 1 and 80),
  tags text[] not null default '{}' check (
    cardinality(tags) between 0 and 6
    and tags <@ array['ai-agent','automation','design-system','frontend','mcp','productivity','research','security','ui-ux']::text[]
  ),
  status text not null default 'review' check (status in ('review', 'published')),
  created_by uuid not null references public.platform_skill_admins(user_id) on delete restrict,
  gemini_model text not null check (char_length(gemini_model) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, version)
);

create index if not exists platform_skill_drafts_status_updated_idx
  on public.platform_skill_drafts(status, updated_at desc);

alter table public.platform_skill_drafts
  drop constraint if exists platform_skill_drafts_created_by_fkey;
alter table public.platform_skill_drafts
  add constraint platform_skill_drafts_created_by_fkey
  foreign key (created_by) references public.platform_skill_admins(user_id) on delete restrict;

drop table if exists private.platform_skill_admins;

alter table public.platform_skill_drafts
  drop constraint if exists platform_skill_drafts_compatible_clients_check,
  drop constraint if exists platform_skill_drafts_source_url_check,
  drop constraint if exists platform_skill_drafts_tags_check;

alter table public.platform_skill_drafts
  add constraint platform_skill_drafts_compatible_clients_check check (
    cardinality(compatible_clients) between 1 and 4
    and compatible_clients <@ array['codex','claude-code','cursor','generic-mcp']::text[]
  ),
  add constraint platform_skill_drafts_source_url_check check (
    source_url is null or source_url ~ '^https://'
  ),
  add constraint platform_skill_drafts_tags_check check (
    cardinality(tags) between 0 and 6
    and tags <@ array['ai-agent','automation','design-system','frontend','mcp','productivity','research','security','ui-ux']::text[]
  );

alter table public.platform_skill_drafts enable row level security;
revoke all on public.platform_skill_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.platform_skill_drafts to service_role;

drop trigger if exists platform_skill_drafts_set_updated_at on public.platform_skill_drafts;
create trigger platform_skill_drafts_set_updated_at
before update on public.platform_skill_drafts
for each row execute function private.set_updated_at();

create or replace function public.publish_platform_skill_draft(
  p_draft_id uuid,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.platform_skill_drafts%rowtype;
begin
  if not exists (
    select 1 from public.platform_skill_admins where user_id = p_actor_id
  ) then
    raise exception using errcode = '42501', message = 'platform_admin_required';
  end if;

  select * into v_draft
  from public.platform_skill_drafts
  where id = p_draft_id
  for update;

  if not found then raise exception 'platform_skill_draft_not_found'; end if;
  if v_draft.status <> 'review' then raise exception 'platform_skill_draft_not_reviewable'; end if;

  if not exists (
    select 1
    from public.skill_versions
    where id = v_draft.skill_version_id
      and skill_id = v_draft.skill_id
      and version = v_draft.version
      and scan_status = 'passed'
      and skill_md_path is not null
      and skill_md_hash is not null
      and skill_md_verified_at is not null
  ) then
    raise exception 'platform_skill_version_not_publish_ready';
  end if;

  update public.skills
  set title = v_draft.title_en,
      description = v_draft.description_en,
      category = v_draft.category,
      compatible_clients = v_draft.compatible_clients,
      source_url = v_draft.source_url,
      license_spdx = v_draft.license_spdx,
      current_version = v_draft.version,
      visibility = 'public',
      status = 'active'
  where id = v_draft.skill_id and owner_id is null;

  if not found then raise exception 'platform_skill_not_found'; end if;

  insert into public.skill_translations(skill_id, locale, title, description)
  values
    (v_draft.skill_id, 'en', v_draft.title_en, v_draft.description_en),
    (v_draft.skill_id, 'vi', v_draft.title_vi, v_draft.description_vi)
  on conflict (skill_id, locale) do update set
    title = excluded.title,
    description = excluded.description,
    updated_at = now();

  delete from public.skill_tags where skill_id = v_draft.skill_id;
  insert into public.skill_tags(skill_id, tag_slug)
  select v_draft.skill_id, tag.slug
  from public.tags tag
  where tag.slug = any(v_draft.tags)
  on conflict do nothing;

  update public.platform_skill_drafts
  set status = 'published'
  where id = v_draft.id;

  return v_draft.skill_id;
end;
$$;

revoke all on function public.publish_platform_skill_draft(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.publish_platform_skill_draft(uuid, uuid)
  to service_role;

commit;
