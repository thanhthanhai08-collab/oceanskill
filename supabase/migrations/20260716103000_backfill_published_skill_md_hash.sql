-- This object was manually reviewed and published before publish-time pinning
-- became mandatory. Keep fresh database replays aligned with production.
update public.skill_versions
set
  skill_md_hash = '98ad3e5b051bfb71b2795f7e8a6aa0d32b51ee095606c098a4b2822ac07926c9',
  skill_md_verified_at = coalesce(skill_md_verified_at, now())
where id = 'f3de8b01-9527-495c-be55-e94e38ce7460'
  and skill_md_bucket = 'skill-artifacts'
  and skill_md_path = 'taste-skill-redesign-skill/SKILL.md'
  and skill_md_hash is null;
