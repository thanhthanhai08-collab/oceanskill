alter table public.profiles
  add column if not exists creator_skill_limit integer not null default 5
  check (creator_skill_limit between 0 and 1000);

create table if not exists public.user_skill_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create index if not exists user_skill_library_user_added_idx
  on public.user_skill_library(user_id, added_at desc);

alter table public.user_skill_library enable row level security;

create policy library_select_own on public.user_skill_library for select
to authenticated
using ((select auth.uid()) = user_id);

create policy library_insert_public_skill_own on public.user_skill_library for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and skill_id in (
    select id from public.skills
    where status = 'active' and visibility = 'public'
  )
);

create policy library_delete_own on public.user_skill_library for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on public.user_skill_library to authenticated;
grant select (creator_skill_limit) on public.profiles to authenticated;

create or replace function private.enforce_creator_skill_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
begin
  if new.owner_id is null then return new; end if;
  if new.owner_id <> (select auth.uid()) then raise exception 'invalid_skill_owner'; end if;
  select creator_skill_limit into v_limit from public.profiles where id = new.owner_id;
  select count(*) into v_count from public.skills where owner_id = new.owner_id;
  if v_count >= coalesce(v_limit, 5) then raise exception 'creator_skill_limit_reached'; end if;
  return new;
end;
$$;

drop trigger if exists skills_enforce_creator_limit on public.skills;
create trigger skills_enforce_creator_limit before insert on public.skills
for each row when (new.owner_id is not null)
execute function private.enforce_creator_skill_limit();

revoke all on function private.enforce_creator_skill_limit() from public, anon, authenticated;

create or replace function private.enforce_usage_skill_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.skills s
    where s.id = new.skill_id and s.status = 'active' and (
      (s.visibility = 'private' and s.owner_id = new.user_id)
      or (s.visibility = 'public' and exists (
        select 1 from public.user_skill_library l
        where l.user_id = new.user_id and l.skill_id = s.id
      ))
    )
  ) then raise exception 'skill_not_in_user_library'; end if;
  return new;
end;
$$;

drop trigger if exists usage_enforce_skill_access on public.usage_events;
create trigger usage_enforce_skill_access before insert on public.usage_events
for each row execute function private.enforce_usage_skill_access();

revoke all on function private.enforce_usage_skill_access() from public, anon, authenticated;
