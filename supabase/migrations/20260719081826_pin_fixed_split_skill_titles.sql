begin;

update public.skills
set title = slug, updated_at = now()
where slug in (
  'taste-skill-brutalist-skill',
  'taste-skill-brandkit',
  'imagegen-frontend-mobile'
);

update public.skill_translations translation
set title = skill.slug, updated_at = now()
from public.skills skill
where translation.skill_id = skill.id
  and skill.slug in (
    'taste-skill-brutalist-skill',
    'taste-skill-brandkit',
    'imagegen-frontend-mobile'
  );

update public.platform_skill_drafts draft
set title_en = skill.slug, title_vi = skill.slug, updated_at = now()
from public.skills skill
where draft.skill_id = skill.id
  and skill.slug in (
    'taste-skill-brutalist-skill',
    'taste-skill-brandkit',
    'imagegen-frontend-mobile'
  );

create or replace function private.pin_fixed_skill_title()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug in ('taste-skill-brutalist-skill', 'taste-skill-brandkit', 'imagegen-frontend-mobile') then
    new.title := new.slug;
  end if;
  return new;
end;
$$;

create or replace function private.pin_fixed_skill_translation_title()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_slug text;
begin
  select slug into v_slug from public.skills where id = new.skill_id;
  if v_slug in ('taste-skill-brutalist-skill', 'taste-skill-brandkit', 'imagegen-frontend-mobile') then
    new.title := v_slug;
  end if;
  return new;
end;
$$;

create or replace function private.pin_fixed_platform_draft_titles()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_slug text;
begin
  select slug into v_slug from public.skills where id = new.skill_id;
  if v_slug in ('taste-skill-brutalist-skill', 'taste-skill-brandkit', 'imagegen-frontend-mobile') then
    new.title_en := v_slug;
    new.title_vi := v_slug;
  end if;
  return new;
end;
$$;

drop trigger if exists skills_pin_fixed_title on public.skills;
create trigger skills_pin_fixed_title
before insert or update of slug, title on public.skills
for each row execute function private.pin_fixed_skill_title();

drop trigger if exists skill_translations_pin_fixed_title on public.skill_translations;
create trigger skill_translations_pin_fixed_title
before insert or update of skill_id, title on public.skill_translations
for each row execute function private.pin_fixed_skill_translation_title();

drop trigger if exists platform_skill_drafts_pin_fixed_titles on public.platform_skill_drafts;
create trigger platform_skill_drafts_pin_fixed_titles
before insert or update of skill_id, title_en, title_vi on public.platform_skill_drafts
for each row execute function private.pin_fixed_platform_draft_titles();

commit;
