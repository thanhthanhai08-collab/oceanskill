create table if not exists public.skill_reviews (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  reviewer_name text not null default 'OceanSkill user' check (char_length(reviewer_name) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, user_id)
);

create index if not exists skill_reviews_skill_updated_idx
  on public.skill_reviews(skill_id, updated_at desc);

create index if not exists skill_reviews_user_updated_idx
  on public.skill_reviews(user_id, updated_at desc);

drop trigger if exists skill_reviews_set_updated_at on public.skill_reviews;
create trigger skill_reviews_set_updated_at before update on public.skill_reviews
for each row execute function private.set_updated_at();

alter table public.skill_reviews enable row level security;

drop policy if exists skill_reviews_select_public on public.skill_reviews;
create policy skill_reviews_select_public on public.skill_reviews for select
to anon, authenticated
using (
  exists (
    select 1 from public.skills s
    where s.id = skill_id and s.status = 'active'
  )
);

drop policy if exists skill_reviews_insert_own on public.skill_reviews;
create policy skill_reviews_insert_own on public.skill_reviews for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.skills s
    where s.id = skill_id and s.status = 'active'
  )
);

drop policy if exists skill_reviews_update_own on public.skill_reviews;
create policy skill_reviews_update_own on public.skill_reviews for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.skill_reviews from anon, authenticated;
grant select on public.skill_reviews to anon, authenticated;
grant insert (skill_id, user_id, rating, body, reviewer_name) on public.skill_reviews to authenticated;
grant update (rating, body, reviewer_name) on public.skill_reviews to authenticated;
