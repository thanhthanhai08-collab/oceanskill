begin;

alter table public.skill_collections
  add column collection_type text not null default 'user';

alter table public.skill_collections
  alter column user_id drop not null;

alter table public.skill_collections
  add constraint skill_collections_type_check
  check (collection_type in ('user', 'platform'));

alter table public.skill_collections
  add constraint skill_collections_owner_type_check
  check (
    (collection_type = 'user' and user_id is not null and visibility = 'private')
    or (collection_type = 'platform' and user_id is null and visibility = 'public')
  );

create unique index skill_collections_platform_slug_key
  on public.skill_collections(slug)
  where collection_type = 'platform';

create unique index skill_collections_platform_name_key
  on public.skill_collections(lower(trim(name)))
  where collection_type = 'platform';

create index skill_collections_type_updated_idx
  on public.skill_collections(collection_type, updated_at desc);

create index if not exists skill_collection_items_skill_id_idx
  on public.skill_collection_items(skill_id);

create index if not exists user_collection_library_collection_id_idx
  on public.user_collection_library(collection_id);

create table public.skill_collection_translations (
  collection_id uuid not null references public.skill_collections(id) on delete cascade,
  locale text not null check (locale in ('en', 'vi')),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection_id, locale)
);

create index skill_collection_translations_locale_idx
  on public.skill_collection_translations(locale, collection_id);

alter table public.skill_collection_translations enable row level security;

drop policy if exists skill_collections_select_own_or_public on public.skill_collections;
create policy skill_collections_select_own_or_platform
  on public.skill_collections for select to authenticated
  using (
    collection_type = 'platform'
    or (collection_type = 'user' and user_id = (select auth.uid()))
  );

drop policy if exists skill_collections_insert_own on public.skill_collections;
create policy skill_collections_insert_own
  on public.skill_collections for insert to authenticated
  with check (
    collection_type = 'user'
    and visibility = 'private'
    and user_id = (select auth.uid())
  );

drop policy if exists skill_collections_update_own on public.skill_collections;
create policy skill_collections_update_own
  on public.skill_collections for update to authenticated
  using (collection_type = 'user' and user_id = (select auth.uid()))
  with check (
    collection_type = 'user'
    and visibility = 'private'
    and user_id = (select auth.uid())
  );

drop policy if exists skill_collections_delete_own on public.skill_collections;
create policy skill_collections_delete_own
  on public.skill_collections for delete to authenticated
  using (collection_type = 'user' and user_id = (select auth.uid()));

drop policy if exists skill_collection_items_select_own_or_public on public.skill_collection_items;
drop policy if exists skill_collection_items_select_own on public.skill_collection_items;
create policy skill_collection_items_select_own_or_platform
  on public.skill_collection_items for select to authenticated
  using (
    exists (
      select 1
      from public.skill_collections c
      where c.id = collection_id
        and (
          c.collection_type = 'platform'
          or (c.collection_type = 'user' and c.user_id = (select auth.uid()))
        )
    )
  );

drop policy if exists skill_collection_items_insert_own_accessible_skill on public.skill_collection_items;
create policy skill_collection_items_insert_own_accessible_skill
  on public.skill_collection_items for insert to authenticated
  with check (
    exists (
      select 1
      from public.skill_collections c
      where c.id = collection_id
        and c.collection_type = 'user'
        and c.user_id = (select auth.uid())
    )
    and (
      exists (
        select 1
        from public.skills s
        where s.id = skill_id
          and s.owner_id = (select auth.uid())
          and s.status = 'active'
      )
      or exists (
        select 1
        from public.user_skill_library l
        where l.skill_id = skill_collection_items.skill_id
          and l.user_id = (select auth.uid())
          and l.enabled = true
      )
    )
  );

drop policy if exists skill_collection_items_update_own on public.skill_collection_items;
create policy skill_collection_items_update_own
  on public.skill_collection_items for update to authenticated
  using (
    exists (
      select 1 from public.skill_collections c
      where c.id = collection_id
        and c.collection_type = 'user'
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.skill_collections c
      where c.id = collection_id
        and c.collection_type = 'user'
        and c.user_id = (select auth.uid())
    )
  );

drop policy if exists skill_collection_items_delete_own on public.skill_collection_items;
create policy skill_collection_items_delete_own
  on public.skill_collection_items for delete to authenticated
  using (
    exists (
      select 1 from public.skill_collections c
      where c.id = collection_id
        and c.collection_type = 'user'
        and c.user_id = (select auth.uid())
    )
  );

drop policy if exists user_collection_library_insert_public_or_own on public.user_collection_library;
create policy user_collection_library_insert_platform_or_own
  on public.user_collection_library for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.skill_collections c
      where c.id = collection_id
        and (
          c.collection_type = 'platform'
          or (c.collection_type = 'user' and c.user_id = (select auth.uid()))
        )
    )
  );

create policy skill_collection_translations_select_accessible
  on public.skill_collection_translations for select to authenticated
  using (
    exists (
      select 1
      from public.skill_collections c
      where c.id = collection_id
        and (
          c.collection_type = 'platform'
          or (c.collection_type = 'user' and c.user_id = (select auth.uid()))
        )
    )
  );

revoke all on public.skill_collection_translations from public, anon, authenticated;
grant select on public.skill_collection_translations to authenticated;

create or replace function public.add_skill_collection_to_library(p_collection_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'unauthorized';
  end if;

  if not exists (
    select 1
    from public.skill_collections c
    where c.id = p_collection_id
      and (
        c.collection_type = 'platform'
        or (c.collection_type = 'user' and c.user_id = v_user_id)
      )
  ) then
    return false;
  end if;

  insert into public.user_collection_library(user_id, collection_id)
  values (v_user_id, p_collection_id)
  on conflict (user_id, collection_id) do nothing;

  insert into public.user_skill_library(user_id, skill_id, enabled)
  select v_user_id, i.skill_id, true
  from public.skill_collection_items i
  join public.skills s on s.id = i.skill_id
  where i.collection_id = p_collection_id
    and s.status = 'active'
    and (
      (s.visibility = 'public')
      or (s.visibility = 'private' and s.owner_id = v_user_id)
    )
  on conflict (user_id, skill_id) do update set enabled = true;

  return true;
end;
$$;

revoke all on function public.add_skill_collection_to_library(uuid) from public, anon, authenticated;
grant execute on function public.add_skill_collection_to_library(uuid) to authenticated;

create or replace function public.mcp_create_skill_collection(
  p_user_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_accent text,
  p_skill_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_collection_id uuid;
begin
  if p_user_id is null then raise exception using errcode = '42501', message = 'unauthorized'; end if;
  if p_name is null or char_length(trim(p_name)) not between 1 and 120 then raise exception using errcode = '22023', message = 'invalid_collection_name'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$' or char_length(p_slug) not between 3 and 80 then raise exception using errcode = '22023', message = 'invalid_collection_slug'; end if;
  if char_length(coalesce(p_description, '')) > 500 then raise exception using errcode = '22023', message = 'invalid_collection_description'; end if;
  if p_accent not in ('primary', 'secondary', 'tertiary') then raise exception using errcode = '22023', message = 'invalid_collection_accent'; end if;
  if p_skill_ids is null or cardinality(p_skill_ids) not between 1 and 100 then raise exception using errcode = '22023', message = 'invalid_collection_skills'; end if;
  if cardinality(p_skill_ids) <> cardinality(array(select distinct unnest(p_skill_ids))) then raise exception using errcode = '22023', message = 'duplicate_collection_skills'; end if;
  if exists (
    select 1
    from unnest(p_skill_ids) requested(skill_id)
    where not exists (
      select 1
      from public.skills s
      where s.id = requested.skill_id
        and s.status = 'active'
        and (
          (s.visibility = 'private' and s.owner_id = p_user_id)
          or (
            s.visibility = 'public'
            and exists (
              select 1 from public.user_skill_library l
              where l.user_id = p_user_id and l.skill_id = s.id and l.enabled = true
            )
          )
        )
    )
  ) then raise exception using errcode = '42501', message = 'collection_skill_not_available'; end if;

  insert into public.skill_collections(user_id, name, slug, description, accent, visibility, collection_type)
  values (p_user_id, trim(p_name), p_slug, trim(coalesce(p_description, '')), p_accent, 'private', 'user')
  returning id into v_collection_id;

  insert into public.skill_collection_items(collection_id, skill_id, position)
  select v_collection_id, skill_id, ordinality - 1
  from unnest(p_skill_ids) with ordinality as selected(skill_id, ordinality);

  insert into public.user_collection_library(user_id, collection_id)
  values (p_user_id, v_collection_id);

  return v_collection_id;
end;
$$;

create or replace function public.mcp_replace_skill_collection(
  p_user_id uuid,
  p_collection_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_skill_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if p_user_id is null then raise exception using errcode = '42501', message = 'unauthorized'; end if;
  if p_name is null or char_length(trim(p_name)) not between 1 and 120 then raise exception using errcode = '22023', message = 'invalid_collection_name'; end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$' or char_length(p_slug) not between 3 and 80 then raise exception using errcode = '22023', message = 'invalid_collection_slug'; end if;
  if char_length(coalesce(p_description, '')) > 500 then raise exception using errcode = '22023', message = 'invalid_collection_description'; end if;
  if p_skill_ids is null or cardinality(p_skill_ids) not between 1 and 100 then raise exception using errcode = '22023', message = 'invalid_collection_skills'; end if;
  if cardinality(p_skill_ids) <> cardinality(array(select distinct unnest(p_skill_ids))) then raise exception using errcode = '22023', message = 'duplicate_collection_skills'; end if;
  if exists (
    select 1
    from unnest(p_skill_ids) requested(skill_id)
    where not exists (
      select 1
      from public.skills s
      where s.id = requested.skill_id
        and s.status = 'active'
        and (
          (s.visibility = 'private' and s.owner_id = p_user_id)
          or (
            s.visibility = 'public'
            and exists (
              select 1 from public.user_skill_library l
              where l.user_id = p_user_id and l.skill_id = s.id and l.enabled = true
            )
          )
        )
    )
  ) then raise exception using errcode = '42501', message = 'collection_skill_not_available'; end if;

  update public.skill_collections
  set name = trim(p_name), slug = p_slug, description = trim(coalesce(p_description, '')), updated_at = now()
  where id = p_collection_id
    and collection_type = 'user'
    and user_id = p_user_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then return false; end if;

  delete from public.skill_collection_items where collection_id = p_collection_id;
  insert into public.skill_collection_items(collection_id, skill_id, position)
  select p_collection_id, skill_id, ordinality - 1
  from unnest(p_skill_ids) with ordinality as selected(skill_id, ordinality);
  return true;
end;
$$;

create or replace function public.mcp_delete_skill_collection(
  p_user_id uuid,
  p_collection_id uuid
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with deleted as (
    delete from public.skill_collections
    where id = p_collection_id
      and collection_type = 'user'
      and user_id = p_user_id
    returning id
  )
  select exists(select 1 from deleted);
$$;

create or replace function public.mcp_add_skill_collection_to_library(
  p_user_id uuid,
  p_collection_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.skill_collections c
    where c.id = p_collection_id
      and (
        c.collection_type = 'platform'
        or (c.collection_type = 'user' and c.user_id = p_user_id)
      )
  ) then return false; end if;

  insert into public.user_collection_library(user_id, collection_id)
  values (p_user_id, p_collection_id)
  on conflict (user_id, collection_id) do nothing;

  insert into public.user_skill_library(user_id, skill_id, enabled)
  select p_user_id, i.skill_id, true
  from public.skill_collection_items i
  join public.skills s on s.id = i.skill_id
  where i.collection_id = p_collection_id
    and s.status = 'active'
    and (
      s.visibility = 'public'
      or (s.visibility = 'private' and s.owner_id = p_user_id)
    )
  on conflict (user_id, skill_id) do update set enabled = true;

  return true;
end;
$$;

revoke all on function public.mcp_create_skill_collection(uuid, text, text, text, text, uuid[]) from public, anon, authenticated;
revoke all on function public.mcp_replace_skill_collection(uuid, uuid, text, text, text, uuid[]) from public, anon, authenticated;
revoke all on function public.mcp_delete_skill_collection(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mcp_add_skill_collection_to_library(uuid, uuid) from public, anon, authenticated;
grant execute on function public.mcp_create_skill_collection(uuid, text, text, text, text, uuid[]) to service_role;
grant execute on function public.mcp_replace_skill_collection(uuid, uuid, text, text, text, uuid[]) to service_role;
grant execute on function public.mcp_delete_skill_collection(uuid, uuid) to service_role;
grant execute on function public.mcp_add_skill_collection_to_library(uuid, uuid) to service_role;

alter table public.mcp_call_events
  drop constraint mcp_call_events_tool_name_check;

alter table public.mcp_call_events
  add constraint mcp_call_events_tool_name_check
  check (tool_name in (
    'list_purchased_skills',
    'search_skills',
    'get_skill_content',
    'get_skill_md',
    'get_skill_reference',
    'list_collections',
    'add_collection_to_library',
    'create_skill_collection',
    'update_skill_collection',
    'delete_skill_collection',
    'execute_skill_collection',
    'toggle_skill',
    'get_usage_summary'
  ));

do $$
begin
  if (
    select count(*) from public.skills
    where slug in ('taste-skill-gpt-tasteskill', 'taste-skill-redesign-skill')
      and status = 'active'
      and visibility = 'public'
  ) <> 2 then
    raise exception 'platform_collection_skills_not_ready';
  end if;
end;
$$;

insert into public.skill_collections(
  user_id, name, slug, description, accent, visibility, collection_type
)
values (
  null,
  'taste-skill',
  'taste-skill',
  'A focused platform collection for designing and redesigning distinctive, production-ready interfaces.',
  'primary',
  'public',
  'platform'
)
on conflict (slug) where collection_type = 'platform' do update
set
  name = excluded.name,
  description = excluded.description,
  accent = excluded.accent,
  visibility = excluded.visibility,
  updated_at = now();

delete from public.skill_collection_items
where collection_id = (
  select id from public.skill_collections
  where collection_type = 'platform' and slug = 'taste-skill'
);

insert into public.skill_collection_items(collection_id, skill_id, position)
select c.id, s.id,
  case s.slug
    when 'taste-skill-gpt-tasteskill' then 0
    when 'taste-skill-redesign-skill' then 1
  end
from public.skill_collections c
cross join public.skills s
where c.collection_type = 'platform'
  and c.slug = 'taste-skill'
  and s.slug in ('taste-skill-gpt-tasteskill', 'taste-skill-redesign-skill');

insert into public.skill_collection_translations(collection_id, locale, name, description)
select id, 'en', 'taste-skill',
  'A focused platform collection for designing and redesigning distinctive, production-ready interfaces.'
from public.skill_collections
where collection_type = 'platform' and slug = 'taste-skill'
on conflict (collection_id, locale) do update
set name = excluded.name, description = excluded.description, updated_at = now();

insert into public.skill_collection_translations(collection_id, locale, name, description)
select id, 'vi', 'taste-skill',
  'Bộ skill nền tảng tập trung vào thiết kế và tái thiết kế giao diện khác biệt, sẵn sàng cho production.'
from public.skill_collections
where collection_type = 'platform' and slug = 'taste-skill'
on conflict (collection_id, locale) do update
set name = excluded.name, description = excluded.description, updated_at = now();

commit;
