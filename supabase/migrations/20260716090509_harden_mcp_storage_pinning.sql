alter table public.skill_reference_files
  add column if not exists content_hash text,
  add column if not exists verified_at timestamptz;

delete from public.skill_reference_files
where lower(replace(reference_key, '\\', '/')) ~ '(^|/)skill\.md$'
   or lower(replace(storage_path, '\\', '/')) ~ '(^|/)skill\.md$';

update public.skill_reference_files
set
  content_hash = '4575a543ab88dad12ccea7d97e563d0bce5b448b06072e65d3264497dad326df',
  verified_at = now()
where skill_version_id = 'f3de8b01-9527-495c-be55-e94e38ce7460'
  and reference_key = 'LICENSE'
  and storage_path = 'taste-skill-redesign-skill/LICENSE';

-- Legacy archive mappings were created before reference hash pinning existed.
-- Keep the Storage objects, but remove their unverified MCP exposure. They can
-- be re-published later with a SHA-256 pin.
delete from public.skill_reference_files
where content_hash is null or verified_at is null;

alter table public.skill_reference_files
  alter column content_hash set not null,
  alter column verified_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_reference_files_content_hash_check'
      and conrelid = 'public.skill_reference_files'::regclass
  ) then
    alter table public.skill_reference_files
      add constraint skill_reference_files_content_hash_check
      check (content_hash ~ '^[0-9a-f]{64}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_reference_files_no_skill_md_check'
      and conrelid = 'public.skill_reference_files'::regclass
  ) then
    alter table public.skill_reference_files
      add constraint skill_reference_files_no_skill_md_check
      check (
        lower(replace(reference_key, '\\', '/')) !~ '(^|/)skill\.md$'
        and lower(replace(storage_path, '\\', '/')) !~ '(^|/)skill\.md$'
      );
  end if;
end;
$$;

alter table public.skill_versions
  drop constraint if exists skill_versions_skill_id_content_hash_key;

alter table public.skill_versions
  drop column if exists content_hash;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_versions_skill_id_skill_md_hash_key'
      and conrelid = 'public.skill_versions'::regclass
  ) then
    alter table public.skill_versions
      add constraint skill_versions_skill_id_skill_md_hash_key
      unique (skill_id, skill_md_hash);
  end if;
end;
$$;

create or replace function public.enforce_pinned_current_skill_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_version public.skill_versions%rowtype;
begin
  if new.status = 'active'
    and (
      tg_op = 'INSERT'
      or old.status is distinct from new.status
      or old.current_version is distinct from new.current_version
    )
  then
    select * into v_version
    from public.skill_versions
    where skill_id = new.id and version = new.current_version;

    if not found
      or v_version.scan_status <> 'passed'
      or v_version.skill_md_path is null
      or v_version.skill_md_hash is null
      or v_version.skill_md_verified_at is null
    then
      raise exception using
        errcode = '23514',
        message = 'current_skill_version_not_publish_ready';
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists skills_require_pinned_current_version on public.skills;
create trigger skills_require_pinned_current_version
before insert or update of status, current_version on public.skills
for each row execute function public.enforce_pinned_current_skill_version();

revoke all on function public.enforce_pinned_current_skill_version() from public, anon, authenticated;
