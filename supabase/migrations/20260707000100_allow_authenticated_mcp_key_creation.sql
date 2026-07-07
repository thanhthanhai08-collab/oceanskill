create or replace function public.create_api_key_record(
  p_user_id uuid,
  p_name text,
  p_key_prefix text,
  p_key_hash text
)
returns public.api_keys
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key public.api_keys%rowtype;
  v_auth_uid uuid;
begin
  v_auth_uid := (select auth.uid());
  if v_auth_uid is null then raise exception 'not_authenticated'; end if;
  if p_user_id <> v_auth_uid then raise exception 'invalid_key_owner'; end if;
  if char_length(p_name) not between 1 and 80 then raise exception 'invalid_key_name'; end if;
  if char_length(p_key_prefix) not between 8 and 24 then raise exception 'invalid_key_prefix'; end if;
  if p_key_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_key_hash'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'profile_not_found';
  end if;
  insert into public.api_keys(user_id, name, key_prefix)
  values (p_user_id, p_name, p_key_prefix)
  returning * into v_key;
  insert into private.api_key_secrets(api_key_id, key_hash)
  values (v_key.id, p_key_hash);
  return v_key;
end;
$$;

revoke all on function public.create_api_key_record(uuid, text, text, text) from public, anon;
grant execute on function public.create_api_key_record(uuid, text, text, text) to authenticated;
