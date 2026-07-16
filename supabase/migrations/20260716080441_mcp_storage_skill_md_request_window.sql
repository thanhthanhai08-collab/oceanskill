alter table public.skill_versions
  add column if not exists skill_md_bucket text not null default 'skill-artifacts',
  add column if not exists skill_md_path text,
  add column if not exists skill_md_size_bytes bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_versions_skill_md_bucket_check'
      and conrelid = 'public.skill_versions'::regclass
  ) then
    alter table public.skill_versions
      add constraint skill_versions_skill_md_bucket_check
      check (skill_md_bucket = 'skill-artifacts');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_versions_skill_md_path_check'
      and conrelid = 'public.skill_versions'::regclass
  ) then
    alter table public.skill_versions
      add constraint skill_versions_skill_md_path_check
      check (
        skill_md_path is null
        or (
          char_length(skill_md_path) between 1 and 1024
          and skill_md_path !~ '(^/|\\|(^|/)\.\.(/|$))'
          and lower(skill_md_path) like '%/skill.md'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'skill_versions_skill_md_size_check'
      and conrelid = 'public.skill_versions'::regclass
  ) then
    alter table public.skill_versions
      add constraint skill_versions_skill_md_size_check
      check (skill_md_size_bytes is null or skill_md_size_bytes between 1 and 1048576);
  end if;
end;
$$;

update public.skill_versions as sv
set
  skill_md_path = mapped.skill_md_path,
  skill_md_size_bytes = mapped.skill_md_size_bytes
from (
  values
    ('912382c6-53c6-44d4-9d70-c43cfeb37eaa'::uuid, 'algorithmic-art/SKILL.md'::text, 19769::bigint),
    ('f68d4083-067f-404f-8514-6f5ab4fd3f7d'::uuid, 'brand-guidelines/SKILL.md'::text, 2235::bigint),
    ('514ca637-acdd-4fd4-98ac-3ebeaf44aa93'::uuid, 'canvas-design/SKILL.md'::text, 11939::bigint),
    ('5cbe597e-cdb9-45fc-8af8-d9d7413044d7'::uuid, 'frontend-design/SKILL.md'::text, 8260::bigint),
    ('ffdc0b5c-e729-4381-bd4e-c031fdbe2b67'::uuid, 'taste-skill/SKILL.md'::text, 87253::bigint),
    ('f3de8b01-9527-495c-be55-e94e38ce7460'::uuid, 'taste-skill-redesign-skill/SKILL.md'::text, 15060::bigint)
) as mapped(skill_version_id, skill_md_path, skill_md_size_bytes)
where sv.id = mapped.skill_version_id;

comment on column public.skill_versions.skill_md_path is
  'Immutable private Storage object path used by get_skill_md; content_md is not read by MCP.';
