begin;

alter table public.platform_skill_drafts
  add column author_id text references public.authors(id) on update cascade on delete restrict,
  add column detail_headline_en text not null default '',
  add column detail_overview_en text not null default '',
  add column detail_feature_one_title_en text not null default '',
  add column detail_feature_one_description_en text not null default '',
  add column detail_feature_two_title_en text not null default '',
  add column detail_feature_two_description_en text not null default '',
  add column detail_headline_vi text not null default '',
  add column detail_overview_vi text not null default '',
  add column detail_feature_one_title_vi text not null default '',
  add column detail_feature_one_description_vi text not null default '',
  add column detail_feature_two_title_vi text not null default '',
  add column detail_feature_two_description_vi text not null default '';

update public.platform_skill_drafts draft
set author_id = skill.author_id
from public.skills skill
where skill.id = draft.skill_id
  and draft.author_id is null;

update public.platform_skill_drafts draft
set
  detail_headline_en = detail.headline,
  detail_overview_en = detail.overview,
  detail_feature_one_title_en = detail.feature_one_title,
  detail_feature_one_description_en = detail.feature_one_description,
  detail_feature_two_title_en = detail.feature_two_title,
  detail_feature_two_description_en = detail.feature_two_description
from public.skill_details detail
where detail.skill_id = draft.skill_id
  and detail.locale = 'en';

update public.platform_skill_drafts draft
set
  detail_headline_vi = detail.headline,
  detail_overview_vi = detail.overview,
  detail_feature_one_title_vi = detail.feature_one_title,
  detail_feature_one_description_vi = detail.feature_one_description,
  detail_feature_two_title_vi = detail.feature_two_title,
  detail_feature_two_description_vi = detail.feature_two_description
from public.skill_details detail
where detail.skill_id = draft.skill_id
  and detail.locale = 'vi';

alter table public.platform_skill_drafts
  drop constraint if exists platform_skill_drafts_compatible_clients_check;

alter table public.platform_skill_drafts
  add constraint platform_skill_drafts_compatible_clients_check check (
    cardinality(compatible_clients) between 0 and 5
    and compatible_clients <@ array['codex','claude-code','cursor','antigravity','generic-mcp']::text[]
  ),
  add constraint platform_skill_drafts_detail_lengths_check check (
    char_length(detail_headline_en) between 0 and 180
    and char_length(detail_overview_en) between 0 and 1200
    and char_length(detail_feature_one_title_en) between 0 and 120
    and char_length(detail_feature_one_description_en) between 0 and 600
    and char_length(detail_feature_two_title_en) between 0 and 120
    and char_length(detail_feature_two_description_en) between 0 and 600
    and char_length(detail_headline_vi) between 0 and 180
    and char_length(detail_overview_vi) between 0 and 1200
    and char_length(detail_feature_one_title_vi) between 0 and 120
    and char_length(detail_feature_one_description_vi) between 0 and 600
    and char_length(detail_feature_two_title_vi) between 0 and 120
    and char_length(detail_feature_two_description_vi) between 0 and 600
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
  v_details_en_complete boolean;
  v_details_vi_complete boolean;
  v_details_en_empty boolean;
  v_details_vi_empty boolean;
begin
  if not exists (select 1 from public.platform_skill_admins where user_id = p_actor_id) then
    raise exception using errcode = '42501', message = 'platform_admin_required';
  end if;

  select * into v_draft
  from public.platform_skill_drafts
  where id = p_draft_id
  for update;

  if not found then raise exception 'platform_skill_draft_not_found'; end if;
  if v_draft.status <> 'review' then raise exception 'platform_skill_draft_not_reviewable'; end if;
  if char_length(trim(v_draft.title_en)) not between 2 and 160
    or char_length(trim(v_draft.title_vi)) not between 2 and 160
    or char_length(trim(v_draft.description_en)) not between 10 and 800
    or char_length(trim(v_draft.description_vi)) not between 10 and 800
    or cardinality(v_draft.compatible_clients) not between 1 and 5
    or v_draft.metadata_source = 'manual_required'
  then raise exception 'platform_skill_metadata_incomplete'; end if;

  if v_draft.author_id is null or not exists (
    select 1 from public.authors where id = v_draft.author_id and verified = true
  ) then raise exception 'platform_skill_author_not_published'; end if;

  v_details_en_complete := char_length(trim(v_draft.detail_headline_en)) between 1 and 180
    and char_length(trim(v_draft.detail_overview_en)) between 1 and 1200
    and char_length(trim(v_draft.detail_feature_one_title_en)) between 1 and 120
    and char_length(trim(v_draft.detail_feature_one_description_en)) between 1 and 600
    and char_length(trim(v_draft.detail_feature_two_title_en)) between 1 and 120
    and char_length(trim(v_draft.detail_feature_two_description_en)) between 1 and 600;
  v_details_vi_complete := char_length(trim(v_draft.detail_headline_vi)) between 1 and 180
    and char_length(trim(v_draft.detail_overview_vi)) between 1 and 1200
    and char_length(trim(v_draft.detail_feature_one_title_vi)) between 1 and 120
    and char_length(trim(v_draft.detail_feature_one_description_vi)) between 1 and 600
    and char_length(trim(v_draft.detail_feature_two_title_vi)) between 1 and 120
    and char_length(trim(v_draft.detail_feature_two_description_vi)) between 1 and 600;
  v_details_en_empty := concat(v_draft.detail_headline_en, v_draft.detail_overview_en,
    v_draft.detail_feature_one_title_en, v_draft.detail_feature_one_description_en,
    v_draft.detail_feature_two_title_en, v_draft.detail_feature_two_description_en) = '';
  v_details_vi_empty := concat(v_draft.detail_headline_vi, v_draft.detail_overview_vi,
    v_draft.detail_feature_one_title_vi, v_draft.detail_feature_one_description_vi,
    v_draft.detail_feature_two_title_vi, v_draft.detail_feature_two_description_vi) = '';
  if not (v_details_en_complete or v_details_en_empty)
    or not (v_details_vi_complete or v_details_vi_empty)
  then raise exception 'platform_skill_details_incomplete'; end if;

  if not exists (
    select 1 from public.skill_versions
    where id = v_draft.skill_version_id and skill_id = v_draft.skill_id
      and version = v_draft.version and scan_status = 'passed'
      and skill_md_path is not null and skill_md_hash is not null and skill_md_verified_at is not null
  ) then raise exception 'platform_skill_version_not_verified'; end if;

  update public.skills set
    title = v_draft.title_en,
    description = v_draft.description_en,
    category = v_draft.category,
    compatible_clients = v_draft.compatible_clients,
    source_url = v_draft.source_url,
    license_spdx = v_draft.license_spdx,
    author_id = v_draft.author_id,
    current_version = v_draft.version,
    visibility = 'public',
    status = 'active'
  where id = v_draft.skill_id and owner_id is null;
  if not found then raise exception 'platform_skill_not_found'; end if;

  insert into public.skill_translations(skill_id, locale, title, description)
  values (v_draft.skill_id, 'en', v_draft.title_en, v_draft.description_en),
         (v_draft.skill_id, 'vi', v_draft.title_vi, v_draft.description_vi)
  on conflict (skill_id, locale) do update set
    title = excluded.title, description = excluded.description, updated_at = now();

  if v_details_en_complete then
    insert into public.skill_details(skill_id, locale, headline, overview,
      feature_one_title, feature_one_description, feature_two_title, feature_two_description)
    values (v_draft.skill_id, 'en', v_draft.detail_headline_en, v_draft.detail_overview_en,
      v_draft.detail_feature_one_title_en, v_draft.detail_feature_one_description_en,
      v_draft.detail_feature_two_title_en, v_draft.detail_feature_two_description_en)
    on conflict (skill_id, locale) do update set
      headline = excluded.headline, overview = excluded.overview,
      feature_one_title = excluded.feature_one_title, feature_one_description = excluded.feature_one_description,
      feature_two_title = excluded.feature_two_title, feature_two_description = excluded.feature_two_description,
      updated_at = now();
  end if;

  if v_details_vi_complete then
    insert into public.skill_details(skill_id, locale, headline, overview,
      feature_one_title, feature_one_description, feature_two_title, feature_two_description)
    values (v_draft.skill_id, 'vi', v_draft.detail_headline_vi, v_draft.detail_overview_vi,
      v_draft.detail_feature_one_title_vi, v_draft.detail_feature_one_description_vi,
      v_draft.detail_feature_two_title_vi, v_draft.detail_feature_two_description_vi)
    on conflict (skill_id, locale) do update set
      headline = excluded.headline, overview = excluded.overview,
      feature_one_title = excluded.feature_one_title, feature_one_description = excluded.feature_one_description,
      feature_two_title = excluded.feature_two_title, feature_two_description = excluded.feature_two_description,
      updated_at = now();
  end if;

  delete from public.skill_tags where skill_id = v_draft.skill_id;
  insert into public.skill_tags(skill_id, tag_slug)
  select v_draft.skill_id, tag.slug from public.tags tag where tag.slug = any(v_draft.tags)
  on conflict do nothing;

  update public.platform_skill_drafts set status = 'published' where id = v_draft.id;
  return v_draft.skill_id;
end;
$$;

revoke all on function public.publish_platform_skill_draft(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.publish_platform_skill_draft(uuid, uuid)
  to service_role;

commit;
