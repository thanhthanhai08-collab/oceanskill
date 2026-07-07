create table if not exists public.skill_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  accent text not null default 'primary' check (accent in ('primary', 'secondary', 'tertiary')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skill_collection_items (
  collection_id uuid not null references public.skill_collections(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  added_at timestamptz not null default now(),
  primary key (collection_id, skill_id)
);

create index if not exists skill_collections_user_updated_idx
  on public.skill_collections(user_id, updated_at desc);

create index if not exists skill_collection_items_skill_idx
  on public.skill_collection_items(skill_id);

drop trigger if exists skill_collections_set_updated_at on public.skill_collections;
create trigger skill_collections_set_updated_at before update on public.skill_collections
for each row execute function private.set_updated_at();

alter table public.skill_collections enable row level security;
alter table public.skill_collection_items enable row level security;

drop policy if exists skill_collections_select_own on public.skill_collections;
create policy skill_collections_select_own on public.skill_collections for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists skill_collections_insert_own on public.skill_collections;
create policy skill_collections_insert_own on public.skill_collections for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists skill_collections_update_own on public.skill_collections;
create policy skill_collections_update_own on public.skill_collections for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists skill_collections_delete_own on public.skill_collections;
create policy skill_collections_delete_own on public.skill_collections for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists skill_collection_items_select_own on public.skill_collection_items;
create policy skill_collection_items_select_own on public.skill_collection_items for select
to authenticated
using (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id and c.user_id = (select auth.uid())
  )
);

drop policy if exists skill_collection_items_insert_own_accessible_skill on public.skill_collection_items;
create policy skill_collection_items_insert_own_accessible_skill on public.skill_collection_items for insert
to authenticated
with check (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id and c.user_id = (select auth.uid())
  )
  and (
    exists (
      select 1 from public.skills s
      where s.id = skill_id and s.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.user_skill_library l
      where l.skill_id = skill_id and l.user_id = (select auth.uid())
    )
  )
);

drop policy if exists skill_collection_items_update_own on public.skill_collection_items;
create policy skill_collection_items_update_own on public.skill_collection_items for update
to authenticated
using (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id and c.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id and c.user_id = (select auth.uid())
  )
);

drop policy if exists skill_collection_items_delete_own on public.skill_collection_items;
create policy skill_collection_items_delete_own on public.skill_collection_items for delete
to authenticated
using (
  exists (
    select 1 from public.skill_collections c
    where c.id = collection_id and c.user_id = (select auth.uid())
  )
);

revoke all on public.skill_collections from anon, authenticated;
revoke all on public.skill_collection_items from anon, authenticated;

grant select, insert, update, delete on public.skill_collections to authenticated;
grant select, insert, update, delete on public.skill_collection_items to authenticated;
