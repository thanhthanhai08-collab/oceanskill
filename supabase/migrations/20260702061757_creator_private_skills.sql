-- Creator skills are private by default and remain invisible to the public catalog.
alter table public.skills
  add column if not exists owner_id uuid references public.profiles(id) on delete restrict,
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

create index if not exists skills_owner_updated_idx
  on public.skills(owner_id, updated_at desc)
  where owner_id is not null;

drop policy if exists skills_select_active on public.skills;
create policy skills_select_public_or_own on public.skills for select
to anon, authenticated
using (
  (status = 'active' and visibility = 'public')
  or ((select auth.uid()) = owner_id)
);

create policy skills_insert_private_own on public.skills for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and visibility = 'private'
  and status in ('draft', 'active')
);

create policy skills_update_private_own on public.skills for update
to authenticated
using ((select auth.uid()) = owner_id and visibility = 'private')
with check ((select auth.uid()) = owner_id and visibility = 'private');

create policy skill_versions_select_own on public.skill_versions for select
to authenticated
using (
  skill_id in (
    select id from public.skills where owner_id = (select auth.uid())
  )
);

create policy skill_versions_insert_own on public.skill_versions for insert
to authenticated
with check (
  skill_id in (
    select id from public.skills
    where owner_id = (select auth.uid()) and visibility = 'private'
  )
);

grant select on public.skills, public.skill_versions to authenticated;
grant insert (slug, title, description, domain, status, current_version,
  compatible_clients, source_url, license_spdx, owner_id, visibility)
  on public.skills to authenticated;
grant update (title, description, domain, status, current_version,
  compatible_clients, source_url, license_spdx, updated_at)
  on public.skills to authenticated;
grant insert (skill_id, version, content_md, content_hash, storage_path,
  scan_status, scan_summary)
  on public.skill_versions to authenticated;

create or replace function public.resolve_mcp_api_key(p_key_hash text)
returns table(api_key_id uuid, user_id uuid)
language sql
security definer
set search_path = ''
as $$
  select k.id, k.user_id
  from private.api_key_secrets s
  join public.api_keys k on k.id = s.api_key_id
  where s.key_hash = p_key_hash
    and k.revoked_at is null
  limit 1;
$$;

revoke all on function public.resolve_mcp_api_key(text) from public, anon, authenticated;
grant execute on function public.resolve_mcp_api_key(text) to service_role;

create or replace function public.reserve_mcp_usage(
  p_user_id uuid,
  p_api_key_id uuid,
  p_skill_id uuid,
  p_tool_name text,
  p_request_id text,
  p_units bigint default 1
)
returns table(result text, usage_event_id uuid, available_units bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.usage_events%rowtype;
  v_version_id uuid;
  v_balance bigint;
  v_reserved bigint;
begin
  if p_units <= 0 or p_units > 1000 then raise exception 'invalid_usage_units'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_event from public.usage_events where request_id = p_request_id;
  if found then
    if v_event.user_id <> p_user_id then raise exception 'request_id_conflict'; end if;
    select coalesce(sum(units), 0) into v_balance from public.credit_ledger where user_id = p_user_id;
    return query select 'duplicate'::text, v_event.id, v_balance;
    return;
  end if;

  if not exists (
    select 1 from public.api_keys
    where id = p_api_key_id and user_id = p_user_id and revoked_at is null
  ) then raise exception 'invalid_api_key'; end if;

  select sv.id into v_version_id
  from public.skills s
  join public.skill_versions sv on sv.skill_id = s.id and sv.version = s.current_version
  where s.id = p_skill_id
    and s.status = 'active'
    and sv.scan_status = 'passed'
    and (s.visibility = 'public' or (s.visibility = 'private' and s.owner_id = p_user_id));
  if v_version_id is null then raise exception 'skill_not_available'; end if;

  select coalesce(sum(units), 0) into v_balance from public.credit_ledger where user_id = p_user_id;
  select coalesce(sum(units), 0) into v_reserved
  from public.usage_events where user_id = p_user_id and status = 'reserved';
  if v_balance - v_reserved < p_units then
    return query select 'insufficient_credits'::text, null::uuid, v_balance - v_reserved;
    return;
  end if;

  insert into public.usage_events(
    request_id, user_id, api_key_id, skill_id, skill_version_id, tool_name, units
  ) values (
    p_request_id, p_user_id, p_api_key_id, p_skill_id, v_version_id, p_tool_name, p_units
  ) returning * into v_event;
  return query select 'reserved'::text, v_event.id, v_balance - v_reserved - p_units;
end;
$$;

revoke all on function public.reserve_mcp_usage(uuid, uuid, uuid, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.reserve_mcp_usage(uuid, uuid, uuid, text, text, bigint)
  to service_role;
