begin;

alter table public.platform_skill_drafts
  add column metadata_source text not null default 'gemini'
    check (metadata_source in ('gemini', 'manual_required', 'manual')),
  add column gemini_error text check (gemini_error is null or char_length(gemini_error) <= 160);

alter table public.platform_skill_drafts
  drop constraint if exists platform_skill_drafts_title_en_check,
  drop constraint if exists platform_skill_drafts_title_vi_check,
  drop constraint if exists platform_skill_drafts_description_en_check,
  drop constraint if exists platform_skill_drafts_description_vi_check,
  drop constraint if exists platform_skill_drafts_compatible_clients_check;

alter table public.platform_skill_drafts
  add constraint platform_skill_drafts_title_en_check check (char_length(title_en) between 0 and 160),
  add constraint platform_skill_drafts_title_vi_check check (char_length(title_vi) between 0 and 160),
  add constraint platform_skill_drafts_description_en_check check (char_length(description_en) between 0 and 800),
  add constraint platform_skill_drafts_description_vi_check check (char_length(description_vi) between 0 and 800),
  add constraint platform_skill_drafts_compatible_clients_check check (
    cardinality(compatible_clients) between 0 and 4
    and compatible_clients <@ array['codex','claude-code','cursor','generic-mcp']::text[]
  );

create or replace function public.publish_platform_skill_draft(
  p_draft_id uuid,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.platform_skill_drafts%rowtype;
begin
  if not exists (select 1 from public.platform_skill_admins where user_id = p_actor_id) then
    raise exception using errcode = '42501', message = 'platform_admin_required';
  end if;
  select * into v_draft from public.platform_skill_drafts where id = p_draft_id for update;
  if not found then raise exception 'platform_skill_draft_not_found'; end if;
  if v_draft.status <> 'review' then raise exception 'platform_skill_draft_not_reviewable'; end if;
  if char_length(trim(v_draft.title_en)) not between 2 and 160
    or char_length(trim(v_draft.title_vi)) not between 2 and 160
    or char_length(trim(v_draft.description_en)) not between 10 and 800
    or char_length(trim(v_draft.description_vi)) not between 10 and 800
    or cardinality(v_draft.compatible_clients) not between 1 and 4
    or v_draft.metadata_source = 'manual_required'
  then raise exception 'platform_skill_metadata_incomplete'; end if;
  if not exists (
    select 1 from public.skill_versions
    where id = v_draft.skill_version_id and skill_id = v_draft.skill_id
      and version = v_draft.version and scan_status = 'passed'
      and skill_md_path is not null and skill_md_hash is not null and skill_md_verified_at is not null
  ) then raise exception 'platform_skill_version_not_verified'; end if;

  update public.skills set title = v_draft.title_en, description = v_draft.description_en,
    category = v_draft.category, compatible_clients = v_draft.compatible_clients,
    source_url = v_draft.source_url, license_spdx = v_draft.license_spdx,
    current_version = v_draft.version, visibility = 'public', status = 'active'
  where id = v_draft.skill_id and owner_id is null;
  if not found then raise exception 'platform_skill_not_found'; end if;

  insert into public.skill_translations(skill_id, locale, title, description)
  values (v_draft.skill_id, 'en', v_draft.title_en, v_draft.description_en),
         (v_draft.skill_id, 'vi', v_draft.title_vi, v_draft.description_vi)
  on conflict (skill_id, locale) do update set title = excluded.title,
    description = excluded.description, updated_at = now();
  delete from public.skill_tags where skill_id = v_draft.skill_id;
  insert into public.skill_tags(skill_id, tag_slug)
  select v_draft.skill_id, tag.slug from public.tags tag where tag.slug = any(v_draft.tags)
  on conflict do nothing;
  update public.platform_skill_drafts set status = 'published' where id = v_draft.id;
  return v_draft.skill_id;
end;
$$;

revoke all on function public.publish_platform_skill_draft(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_platform_skill_draft(uuid, uuid) to service_role;

commit;
