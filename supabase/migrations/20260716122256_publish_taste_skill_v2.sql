begin;

-- A semantic version label may change even when the reviewed artifact bytes do
-- not. Integrity is still enforced by the per-row SHA-256 pin.
alter table public.skill_versions
  drop constraint if exists skill_versions_skill_id_skill_md_hash_key;

insert into public.skill_versions (
  skill_id,
  version,
  content_md,
  scan_status,
  scan_summary,
  skill_md_bucket,
  skill_md_path,
  skill_md_size_bytes,
  skill_md_hash,
  skill_md_verified_at
)
select
  skill_id,
  '2.0.0',
  content_md,
  'passed',
  coalesce(scan_summary, '{}'::jsonb)
    || jsonb_build_object(
      'pipeline', 'manual-storage-publish-v2',
      'published_at', now(),
      'source_version_id', id
    ),
  'skill-artifacts',
  'taste-skill-redesign-skill/v2.0.0/SKILL.md',
  15060,
  '98ad3e5b051bfb71b2795f7e8a6aa0d32b51ee095606c098a4b2822ac07926c9',
  now()
from public.skill_versions
where id = 'f3de8b01-9527-495c-be55-e94e38ce7460'
on conflict (skill_id, version) do update
set
  content_md = excluded.content_md,
  scan_status = excluded.scan_status,
  scan_summary = excluded.scan_summary,
  skill_md_bucket = excluded.skill_md_bucket,
  skill_md_path = excluded.skill_md_path,
  skill_md_size_bytes = excluded.skill_md_size_bytes,
  skill_md_hash = excluded.skill_md_hash,
  skill_md_verified_at = excluded.skill_md_verified_at;

insert into public.skill_reference_files (
  skill_version_id,
  reference_key,
  storage_bucket,
  storage_path,
  display_name,
  mime_type,
  size_bytes,
  content_hash,
  verified_at
)
select
  id,
  'LICENSE',
  'skill-artifacts',
  'taste-skill-redesign-skill/v2.0.0/LICENSE',
  'LICENSE',
  'text/plain',
  1065,
  '4575a543ab88dad12ccea7d97e563d0bce5b448b06072e65d3264497dad326df',
  now()
from public.skill_versions
where skill_id = 'ab6a06cf-c9c4-47b9-be5b-0b78c1800617'
  and version = '2.0.0'
on conflict (skill_version_id, reference_key) do update
set
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  display_name = excluded.display_name,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  content_hash = excluded.content_hash,
  verified_at = excluded.verified_at;

update public.skills
set current_version = '2.0.0'
where id = 'ab6a06cf-c9c4-47b9-be5b-0b78c1800617';

commit;
