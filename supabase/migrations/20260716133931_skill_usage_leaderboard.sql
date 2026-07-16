begin;

create table if not exists public.skill_usage_daily (
  skill_id uuid not null references public.skills(id) on delete cascade,
  usage_date date not null,
  successful_calls bigint not null default 0 check (successful_calls >= 0),
  primary key (skill_id, usage_date)
);

create index if not exists skill_usage_daily_date_skill_idx
  on public.skill_usage_daily(usage_date, skill_id);

alter table public.skill_usage_daily enable row level security;

drop policy if exists skill_usage_daily_select_public on public.skill_usage_daily;
create policy skill_usage_daily_select_public
  on public.skill_usage_daily
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.skills s
      where s.id = skill_usage_daily.skill_id
        and s.status = 'active'
        and s.visibility = 'public'
    )
  );

revoke all on table public.skill_usage_daily from public, anon, authenticated;
grant select on table public.skill_usage_daily to anon, authenticated;

create or replace function private.adjust_skill_usage_daily(
  p_skill_id uuid,
  p_usage_date date,
  p_delta bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_delta > 0 then
    insert into public.skill_usage_daily(skill_id, usage_date, successful_calls)
    values (p_skill_id, p_usage_date, p_delta)
    on conflict (skill_id, usage_date) do update
    set successful_calls = public.skill_usage_daily.successful_calls + excluded.successful_calls;
  elsif p_delta < 0 then
    update public.skill_usage_daily
    set successful_calls = greatest(0, successful_calls + p_delta)
    where skill_id = p_skill_id
      and usage_date = p_usage_date;

    delete from public.skill_usage_daily
    where skill_id = p_skill_id
      and usage_date = p_usage_date
      and successful_calls = 0;
  end if;
end;
$$;

create or replace function private.sync_skill_usage_daily()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status = 'succeeded' then
    perform private.adjust_skill_usage_daily(
      old.skill_id,
      (coalesce(old.completed_at, old.created_at) at time zone 'UTC')::date,
      -1
    );
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.status = 'succeeded' then
    perform private.adjust_skill_usage_daily(
      new.skill_id,
      (coalesce(new.completed_at, new.created_at) at time zone 'UTC')::date,
      1
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.adjust_skill_usage_daily(uuid, date, bigint) from public, anon, authenticated;
revoke all on function private.sync_skill_usage_daily() from public, anon, authenticated;

insert into public.skill_usage_daily(skill_id, usage_date, successful_calls)
select
  ue.skill_id,
  (coalesce(ue.completed_at, ue.created_at) at time zone 'UTC')::date,
  count(*)::bigint
from public.usage_events ue
where ue.status = 'succeeded'
group by ue.skill_id, (coalesce(ue.completed_at, ue.created_at) at time zone 'UTC')::date
on conflict (skill_id, usage_date) do update
set successful_calls = excluded.successful_calls;

drop trigger if exists sync_skill_usage_daily on public.usage_events;
create trigger sync_skill_usage_daily
after insert or update or delete on public.usage_events
for each row execute function private.sync_skill_usage_daily();

create index if not exists skill_reviews_skill_rating_idx
  on public.skill_reviews(skill_id, rating);

drop function if exists public.get_skill_leaderboard(text);
drop function if exists public.get_skill_leaderboard(text, text);

create function public.get_skill_leaderboard(
  p_period text default 'month',
  p_locale text default 'en'
)
returns table (
  rank bigint,
  skill_id uuid,
  slug text,
  title text,
  description text,
  category text,
  current_version text,
  author_id text,
  author_name text,
  author_handle text,
  author_avatar_url text,
  mcp_calls bigint,
  average_rating numeric,
  review_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select
      case p_period
        when 'day' then (now() at time zone 'UTC')::date
        when 'month' then date_trunc('month', now() at time zone 'UTC')::date
        when 'year' then date_trunc('year', now() at time zone 'UTC')::date
      end as period_start,
      case p_period
        when 'day' then (now() at time zone 'UTC')::date + 1
        when 'month' then (date_trunc('month', now() at time zone 'UTC') + interval '1 month')::date
        when 'year' then (date_trunc('year', now() at time zone 'UTC') + interval '1 year')::date
      end as period_end
    where p_period in ('day', 'month', 'year')
  ),
  usage_totals as (
    select d.skill_id, sum(d.successful_calls)::bigint as mcp_calls
    from public.skill_usage_daily d
    cross join bounds b
    where d.usage_date >= b.period_start
      and d.usage_date < b.period_end
    group by d.skill_id
  ),
  rating_totals as (
    select
      sr.skill_id,
      round(avg(sr.rating)::numeric, 2) as average_rating,
      count(*)::bigint as review_count
    from public.skill_reviews sr
    group by sr.skill_id
  ),
  leaderboard_rows as (
    select
      s.id as skill_id,
      s.slug,
      coalesce(localized.title, english.title, s.title) as title,
      coalesce(localized.description, english.description, s.description) as description,
      s.category,
      s.current_version,
      a.id as author_id,
      a.name as author_name,
      a.handle as author_handle,
      a.avatar_url as author_avatar_url,
      coalesce(u.mcp_calls, 0)::bigint as mcp_calls,
      coalesce(r.average_rating, 0)::numeric as average_rating,
      coalesce(r.review_count, 0)::bigint as review_count
    from public.skills s
    inner join public.authors a
      on a.id = s.author_id
     and a.verified = true
    cross join bounds b
    left join public.skill_translations localized
      on localized.skill_id = s.id
     and localized.locale = case when p_locale in ('en', 'vi') then p_locale else 'en' end
    left join public.skill_translations english
      on english.skill_id = s.id
     and english.locale = 'en'
    left join usage_totals u on u.skill_id = s.id
    left join rating_totals r on r.skill_id = s.id
    where s.status = 'active'
      and s.visibility = 'public'
  )
  select
    row_number() over (
      order by
        l.mcp_calls desc,
        l.average_rating desc,
        l.review_count desc,
        l.title asc,
        l.skill_id asc
    ) as rank,
    l.skill_id,
    l.slug,
    l.title,
    l.description,
    l.category,
    l.current_version,
    l.author_id,
    l.author_name,
    l.author_handle,
    l.author_avatar_url,
    l.mcp_calls,
    l.average_rating,
    l.review_count
  from leaderboard_rows l
  order by rank;
$$;

revoke all on function public.get_skill_leaderboard(text, text) from public, anon, authenticated;
grant execute on function public.get_skill_leaderboard(text, text) to anon, authenticated;

comment on table public.skill_usage_daily is
  'Public aggregate of successful MCP skill calls by UTC calendar day. Contains no user or request identifiers.';
comment on function public.get_skill_leaderboard(text, text) is
  'Ranks active public skills by successful MCP calls, then average rating and review count for the current UTC day, month, or year.';

commit;
