create or replace function public.replace_skill_collection(
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
  if p_name is null or char_length(trim(p_name)) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'invalid_collection_name';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$' or char_length(p_slug) not between 3 and 80 then
    raise exception using errcode = '22023', message = 'invalid_collection_slug';
  end if;
  if p_description is null or char_length(p_description) > 500 then
    raise exception using errcode = '22023', message = 'invalid_collection_description';
  end if;
  if p_skill_ids is null or cardinality(p_skill_ids) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_collection_skills';
  end if;
  if cardinality(p_skill_ids) <> cardinality(array(select distinct unnest(p_skill_ids))) then
    raise exception using errcode = '22023', message = 'duplicate_collection_skills';
  end if;

  update public.skill_collections
  set name = trim(p_name), slug = p_slug, description = trim(p_description)
  where id = p_collection_id and user_id = (select auth.uid());

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;
  end if;

  delete from public.skill_collection_items
  where collection_id = p_collection_id;

  insert into public.skill_collection_items (collection_id, skill_id, position)
  select p_collection_id, skill_id, ordinality - 1
  from unnest(p_skill_ids) with ordinality as requested(skill_id, ordinality);

  return true;
end;
$$;

revoke all on function public.replace_skill_collection(uuid, text, text, text, uuid[]) from public, anon;
grant execute on function public.replace_skill_collection(uuid, text, text, text, uuid[]) to authenticated;

create or replace function public.reserve_mcp_usage_versioned(
  p_user_id uuid,
  p_api_key_id uuid,
  p_skill_id uuid,
  p_skill_version_id uuid,
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
  reservation record;
  reserved_version_id uuid;
begin
  select * into reservation
  from public.reserve_mcp_usage(
    p_user_id,
    p_api_key_id,
    p_skill_id,
    p_tool_name,
    p_request_id,
    p_units
  );

  if reservation.result in ('reserved', 'duplicate') then
    select skill_version_id into reserved_version_id
    from public.usage_events
    where id = reservation.usage_event_id;

    if reserved_version_id is distinct from p_skill_version_id then
      if reservation.result = 'reserved' then
        delete from public.usage_events
        where id = reservation.usage_event_id and status = 'reserved';
      end if;
      return query select 'version_conflict'::text, null::uuid, reservation.available_units;
      return;
    end if;
  end if;

  return query select reservation.result, reservation.usage_event_id, reservation.available_units;
end;
$$;

revoke all on function public.reserve_mcp_usage_versioned(uuid, uuid, uuid, uuid, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.reserve_mcp_usage_versioned(uuid, uuid, uuid, uuid, text, text, bigint)
  to service_role;
