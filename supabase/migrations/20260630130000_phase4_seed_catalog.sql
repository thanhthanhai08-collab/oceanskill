with catalog(slug, title, description, domain, compatible_clients, source_url, license_spdx) as (
  values
    ('secure-code-review', 'Secure Code Review', 'Review application changes for trust-boundary failures, authorization gaps, unsafe data flow, and deployment risk.', 'security', array['Codex', 'Claude Code', 'Cursor']::text[], null::text, 'Proprietary'),
    ('supabase-rls-audit', 'Supabase RLS Audit', 'Audit exposed schemas, row-level security policies, grants, views, and privileged functions before production.', 'development', array['Codex', 'Claude Code']::text[], null::text, 'Proprietary'),
    ('product-discovery-sprint', 'Product Discovery Sprint', 'Turn a broad product idea into a narrow, testable wedge with explicit assumptions and an executable validation plan.', 'agent-first', array['Codex', 'Claude Code', 'Cursor']::text[], null::text, 'Proprietary')
)
insert into public.skills(slug, title, description, domain, status, compatible_clients, source_url, license_spdx)
select slug, title, description, domain, 'active', compatible_clients, source_url, license_spdx from catalog
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, domain = excluded.domain,
  status = excluded.status, compatible_clients = excluded.compatible_clients,
  source_url = excluded.source_url, license_spdx = excluded.license_spdx;

with content(slug, body) as (
  values
    ('secure-code-review', E'# Secure Code Review\n\nInspect the requested change, identify concrete security and reliability risks, and report findings with file-level evidence and actionable remediations.'),
    ('supabase-rls-audit', E'# Supabase RLS Audit\n\nInspect exposed schemas, grants, policies, views, and privileged functions. Verify every user-data path enforces ownership and least privilege.'),
    ('product-discovery-sprint', E'# Product Discovery Sprint\n\nConvert the product intent into a focused validation sprint. State assumptions, the narrowest useful wedge, success criteria, and the next executable experiment.')
)
insert into public.skill_versions(skill_id, version, content_md, content_hash, scan_status, scan_summary)
select skills.id, '1.0.0', content.body, encode(extensions.digest(content.body, 'sha256'), 'hex'),
  'passed', jsonb_build_object('scanner', 'curated-manual-review', 'result', 'passed')
from content join public.skills on skills.slug = content.slug
on conflict (skill_id, version) do update set
  content_md = excluded.content_md, content_hash = excluded.content_hash,
  scan_status = excluded.scan_status, scan_summary = excluded.scan_summary;

update public.skills set current_version = '1.0.0'
where slug in ('secure-code-review', 'supabase-rls-audit', 'product-discovery-sprint');

create index if not exists payment_orders_pack_id_idx on public.payment_orders(pack_id);
create index if not exists skills_current_version_idx on public.skills(id, current_version);
