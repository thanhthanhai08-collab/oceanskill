alter table public.skill_collections
  add column if not exists slug text;

update public.skill_collections
set slug = 'collection-' || replace(left(id::text, 8), '-', '')
where slug is null or slug = '';

alter table public.skill_collections
  alter column slug set not null;

alter table public.skill_collections
  add constraint skill_collections_slug_format
  check (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$' and char_length(slug) between 3 and 80);

create unique index if not exists skill_collections_user_slug_key
  on public.skill_collections(user_id, slug);

do $$
declare
  duplicate_row record;
  candidate text;
  candidate_suffix integer;
begin
  for duplicate_row in
    select id, user_id, name
    from (
      select
        id,
        user_id,
        name,
        row_number() over (
          partition by user_id, lower(trim(name))
          order by created_at, id
        ) as duplicate_index
      from public.skill_collections
    ) ranked
    where duplicate_index > 1
  loop
    candidate := left(duplicate_row.name, 68) || ' [deduplicated ' || duplicate_row.id::text || ']';
    candidate_suffix := 2;

    while exists (
      select 1
      from public.skill_collections existing
      where existing.user_id = duplicate_row.user_id
        and existing.id <> duplicate_row.id
        and lower(trim(existing.name)) = lower(trim(candidate))
    ) loop
      candidate := left(duplicate_row.name, 55) || ' [deduplicated ' || duplicate_row.id::text || '-' || candidate_suffix::text || ']';
      candidate_suffix := candidate_suffix + 1;
    end loop;

    update public.skill_collections
    set name = candidate
    where id = duplicate_row.id;
  end loop;
end;
$$;

create unique index if not exists skill_collections_user_name_key
  on public.skill_collections(user_id, lower(trim(name)));
