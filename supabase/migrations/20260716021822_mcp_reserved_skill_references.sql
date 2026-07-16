alter table public.usage_events
  add column if not exists resource_key text;

alter table public.usage_events
  drop constraint if exists usage_events_tool_name_check;

alter table public.usage_events
  add constraint usage_events_tool_name_check check (tool_name in (
    'list_purchased_skills',
    'search_skills',
    'get_skill_content',
    'get_skill_md',
    'get_skill_reference'
  ));

alter table public.mcp_call_events
  drop constraint if exists mcp_call_events_tool_name_check;

alter table public.mcp_call_events
  add constraint mcp_call_events_tool_name_check check (tool_name in (
    'list_purchased_skills',
    'search_skills',
    'get_skill_content',
    'get_skill_md',
    'get_skill_reference',
    'list_collections',
    'add_collection_to_library',
    'toggle_skill',
    'get_usage_summary'
  ));

create table public.skill_reference_files (
  id uuid primary key default gen_random_uuid(),
  skill_version_id uuid not null references public.skill_versions(id) on delete cascade,
  reference_key text not null check (
    char_length(reference_key) between 1 and 240
    and reference_key !~ '(^/|\\|(^|/)\.\.(/|$))'
  ),
  storage_bucket text not null default 'skill-artifacts' check (storage_bucket = 'skill-artifacts'),
  storage_path text not null check (
    char_length(storage_path) between 1 and 1024
    and storage_path !~ '(^/|\\|(^|/)\.\.(/|$))'
  ),
  display_name text not null check (char_length(display_name) between 1 and 240),
  mime_type text not null default 'application/octet-stream' check (char_length(mime_type) between 1 and 160),
  size_bytes bigint check (size_bytes is null or size_bytes between 0 and 1048576),
  created_at timestamptz not null default now(),
  unique (skill_version_id, reference_key),
  unique (skill_version_id, storage_bucket, storage_path)
);

create index skill_reference_files_version_idx
  on public.skill_reference_files(skill_version_id, reference_key);

alter table public.skill_reference_files enable row level security;
revoke all on public.skill_reference_files from public, anon, authenticated;
grant select on public.skill_reference_files to service_role;

insert into public.skill_reference_files (
  skill_version_id,
  reference_key,
  storage_bucket,
  storage_path,
  display_name,
  mime_type
)
select
  id,
  regexp_replace(storage_path, '^skill-artifacts/', ''),
  'skill-artifacts',
  regexp_replace(storage_path, '^skill-artifacts/', ''),
  regexp_replace(storage_path, '^.*/', ''),
  case
    when lower(storage_path) like '%.md' then 'text/markdown'
    when lower(storage_path) like '%.txt' then 'text/plain'
    when lower(storage_path) like '%.json' then 'application/json'
    when lower(storage_path) like '%.yaml' or lower(storage_path) like '%.yml' then 'application/yaml'
    when lower(storage_path) like '%.zip' then 'application/zip'
    else 'application/octet-stream'
  end
from public.skill_versions
where nullif(regexp_replace(storage_path, '^skill-artifacts/', ''), '') is not null
on conflict (skill_version_id, reference_key) do nothing;

create or replace function public.reserve_mcp_usage_resource_versioned(
  p_user_id uuid,
  p_api_key_id uuid,
  p_skill_id uuid,
  p_skill_version_id uuid,
  p_tool_name text,
  p_request_id text,
  p_resource_key text default null,
  p_units bigint default 1
)
returns table(result text, usage_event_id uuid, available_units bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation record;
  v_existing_resource_key text;
begin
  if p_tool_name not in ('get_skill_md', 'get_skill_reference') then
    raise exception using errcode = '22023', message = 'invalid_paid_mcp_tool';
  end if;

  select * into v_reservation
  from public.reserve_mcp_usage_versioned(
    p_user_id,
    p_api_key_id,
    p_skill_id,
    p_skill_version_id,
    p_tool_name,
    p_request_id,
    p_units
  );

  if v_reservation.result = 'reserved' then
    update public.usage_events
    set resource_key = p_resource_key
    where id = v_reservation.usage_event_id and status = 'reserved';
  elsif v_reservation.result = 'duplicate' then
    select resource_key into v_existing_resource_key
    from public.usage_events
    where id = v_reservation.usage_event_id;

    if v_existing_resource_key is distinct from p_resource_key then
      return query select 'resource_conflict'::text, null::uuid, v_reservation.available_units;
      return;
    end if;
  end if;

  return query select v_reservation.result, v_reservation.usage_event_id, v_reservation.available_units;
end;
$$;

revoke all on function public.reserve_mcp_usage_resource_versioned(uuid, uuid, uuid, uuid, text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.reserve_mcp_usage_resource_versioned(uuid, uuid, uuid, uuid, text, text, text, bigint)
  to service_role;
