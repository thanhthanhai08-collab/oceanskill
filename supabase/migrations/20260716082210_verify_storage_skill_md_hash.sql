alter table public.skill_versions
  add column if not exists skill_md_hash text,
  add column if not exists skill_md_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_versions_skill_md_hash_check'
      and conrelid = 'public.skill_versions'::regclass
  ) then
    alter table public.skill_versions
      add constraint skill_versions_skill_md_hash_check
      check (skill_md_hash is null or skill_md_hash ~ '^[0-9a-f]{64}$');
  end if;
end;
$$;

update public.skill_versions
set
  content_hash = 'b9c9a491aca6798cb79d0e73e630b210f772b00213466f3ded6d86fedd4a8ca2',
  skill_md_hash = null,
  skill_md_verified_at = now(),
  scan_summary = coalesce(scan_summary, '{}'::jsonb)
    - 'storage_hash_source'
    - 'storage_hash_verified_at'
    || jsonb_build_object('storage_review', 'approved-before-publish')
where id = 'f3de8b01-9527-495c-be55-e94e38ce7460';

comment on column public.skill_versions.skill_md_hash is
  'SHA-256 of the immutable raw Storage SKILL.md object; initialized by the Edge Function only after manual review.';

comment on column public.skill_versions.skill_md_verified_at is
  'Manual review gate. get_skill_md rejects Storage objects until this value is present.';
