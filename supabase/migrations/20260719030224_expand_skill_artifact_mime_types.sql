-- Keep the private artifact bucket aligned with the allowlist enforced by
-- src/lib/skills/package.ts. Uploads still run server-side with upsert=false.
update storage.buckets
set allowed_mime_types = array[
  'application/zip',
  'application/x-zip-compressed',
  'text/markdown',
  'text/plain',
  'application/javascript',
  'application/json',
  'application/yaml',
  'application/xml',
  'text/html',
  'text/css',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif'
]::text[]
where id = 'skill-artifacts';

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'skill-artifacts' and public = false) then
    raise exception 'private_skill_artifacts_bucket_not_found';
  end if;
end;
$$;
