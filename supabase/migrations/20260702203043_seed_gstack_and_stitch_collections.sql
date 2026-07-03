-- Licensed upstream collections represented by reviewed OceanSkill wrappers.
-- gstack: MIT, upstream version 1.58.5.0
-- Stitch Skills: Apache-2.0, upstream release v1.0
begin;

create temporary table platform_collection_catalog (
  id uuid primary key,
  slug text not null,
  title text not null,
  description text not null,
  domain text not null,
  version text not null,
  storage_path text not null,
  clients text[] not null,
  source_url text not null,
  license_spdx text not null,
  content_md text not null,
  attribution text not null
) on commit drop;

insert into platform_collection_catalog
  (id, slug, title, description, domain, version, storage_path, clients, source_url, license_spdx, content_md, attribution)
values
  (
    '00000000-0000-4000-8000-000000000101'::uuid,
    'gstack-engineering-workflow',
    'gstack by Garry Tan',
    'An opinionated AI engineering workflow covering product discovery, planning, design, review, QA, security, documentation, and shipping.',
    'agent-first',
    '1.58.5.0',
    'skill-artifacts/gstack.zip',
    array['Codex','Claude Code','Cursor']::text[],
    'https://github.com/garrytan/gstack',
    'MIT',
    $gstack$# gstack by Garry Tan

Use the official gstack repository as the source of truth. This OceanSkill entry provides discovery and provenance; install or update the upstream package before invoking its individual workflows.

## Source

- Repository: https://github.com/garrytan/gstack
- License: MIT
- Upstream version at review: 1.58.5.0

## Workflow

1. Choose the smallest relevant specialist such as office hours, planning, review, QA, security, documentation, or shipping.
2. Read that upstream skill's current SKILL.md completely.
3. Preserve its safety gates and user-approval boundaries.
4. Run its verification steps before reporting completion.

Do not treat this wrapper as a replacement for the current upstream files.$gstack$,
    'Copyright Garry Tan and gstack contributors; redistributed under the MIT License.'
  ),
  (
    '00000000-0000-4000-8000-000000000102'::uuid,
    'google-stitch-design-skills',
    'Stitch Skills by Google Labs',
    'A collection of Agent Skills for generating Stitch designs, extracting design systems, building React or React Native interfaces, and producing supporting assets.',
    'design',
    '1.0.0',
    'skill-artifacts/stitch-skills.zip',
    array['Codex','Antigravity','Gemini CLI','Claude Code','Cursor']::text[],
    'https://github.com/google-labs-code/stitch-skills',
    'Apache-2.0',
    $stitch$# Stitch Skills by Google Labs

Use the official Stitch Skills repository as the source of truth. Select the narrowest plugin or skill for the task and read its current SKILL.md before acting.

## Source

- Repository: https://github.com/google-labs-code/stitch-skills
- License: Apache-2.0
- Upstream release at review: v1.0

## Skill families

- Design: generate, upload, extract, and manage Stitch designs and design systems.
- Build: convert Stitch output into React, React Native, Remotion, or shadcn/ui implementations.
- Utilities: improve prompts, generate DESIGN.md, run Stitch loops, and enforce design quality.

This repository is an open-source Google Labs project and is not an officially supported Google product.$stitch$,
    'Copyright Google LLC and contributors; licensed under Apache License 2.0.'
  );

insert into public.skills(id,slug,title,description,domain,status,compatible_clients,source_url,license_spdx)
select id,slug,title,description,domain,'active',clients,source_url,license_spdx
from platform_collection_catalog
on conflict (slug) do update set
  title=excluded.title, description=excluded.description, domain=excluded.domain,
  status='active', compatible_clients=excluded.compatible_clients,
  source_url=excluded.source_url, license_spdx=excluded.license_spdx, updated_at=now();

insert into public.skill_versions(skill_id,version,content_md,content_hash,storage_path,scan_status,scan_summary)
select s.id,c.version,c.content_md,encode(extensions.digest(c.content_md,'sha256'),'hex'),c.storage_path,'passed',
  jsonb_build_object('pipeline','platform-upstream-wrapper-v1','source',c.source_url,'license',c.license_spdx,'attribution',c.attribution,'reviewed_at','2026-07-03')
from platform_collection_catalog c
join public.skills s on s.slug=c.slug
on conflict (skill_id,version) do update set
  content_md=excluded.content_md, content_hash=excluded.content_hash,
  storage_path=excluded.storage_path, scan_status=excluded.scan_status,
  scan_summary=excluded.scan_summary;

update public.skills s set current_version=c.version,updated_at=now()
from platform_collection_catalog c where s.slug=c.slug
and exists(select 1 from public.skill_versions sv where sv.skill_id=s.id and sv.version=c.version);

commit;
