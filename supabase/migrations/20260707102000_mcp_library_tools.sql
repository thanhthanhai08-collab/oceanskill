alter table public.user_skill_library
  add column if not exists enabled boolean not null default true;

create index if not exists user_skill_library_user_enabled_idx
  on public.user_skill_library(user_id, enabled, added_at desc);

alter table public.skill_collections
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'public'));

create index if not exists skill_collections_visibility_updated_idx
  on public.skill_collections(visibility, updated_at desc);

create table if not exists public.user_collection_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  collection_id uuid not null references public.skill_collections(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, collection_id)
);

create index if not exists user_collection_library_user_added_idx
  on public.user_collection_library(user_id, added_at desc);

alter table public.user_collection_library enable row level security;

drop policy if exists skill_collections_select_own on public.skill_collections;
create policy skill_collections_select_own_or_public on public.skill_collections for select
to authenticated
using (visibility = 'public' or (select auth.uid()) = user_id);

drop policy if exists skill_collection_items_select_own on public.skill_collection_items;
create policy skill_collection_items_select_own_or_public on public.skill_collection_items for select
to authenticated
using (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id
      and (c.visibility = 'public' or c.user_id = (select auth.uid()))
  )
);

drop policy if exists user_collection_library_select_own on public.user_collection_library;
create policy user_collection_library_select_own on public.user_collection_library for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists user_collection_library_insert_public_or_own on public.user_collection_library;
create policy user_collection_library_insert_public_or_own on public.user_collection_library for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.skill_collections c
    where c.id = collection_id
      and (c.visibility = 'public' or c.user_id = (select auth.uid()))
  )
);

drop policy if exists user_collection_library_delete_own on public.user_collection_library;
create policy user_collection_library_delete_own on public.user_collection_library for delete
to authenticated
using ((select auth.uid()) = user_id);

grant update (enabled) on public.user_skill_library to authenticated;
grant select, insert, delete on public.user_collection_library to authenticated;
