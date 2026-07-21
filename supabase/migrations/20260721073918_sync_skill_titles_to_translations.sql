create or replace function private.sync_skill_title_translations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fallback_description text;
begin
  -- Existing translations keep their localized descriptions. This fallback is
  -- used only when a locale row does not exist yet.
  fallback_description := left(
    coalesce(nullif(btrim(new.description), ''), new.title),
    800
  );

  insert into public.skill_translations as translations (
    skill_id,
    locale,
    title,
    description,
    updated_at
  )
  values
    (new.id, 'en', new.title, fallback_description, now()),
    (new.id, 'vi', new.title, fallback_description, now())
  on conflict (skill_id, locale)
  do update
    set title = excluded.title,
        updated_at = now();

  return new;
end;
$$;

revoke all on function private.sync_skill_title_translations()
  from public, anon, authenticated;

drop trigger if exists skills_sync_title_translations on public.skills;

create trigger skills_sync_title_translations
after update of title on public.skills
for each row
when (old.title is distinct from new.title)
execute function private.sync_skill_title_translations();

comment on function private.sync_skill_title_translations() is
  'Synchronizes an edited canonical skill title to the English and Vietnamese translation rows.';
