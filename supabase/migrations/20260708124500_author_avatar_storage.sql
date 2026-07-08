alter table public.authors
  add column if not exists avatar_path text,
  add column if not exists avatar_url text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatar-author',
  'avatar-author',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.skills
  add column if not exists author_id text references public.authors(id) on delete restrict;

update public.skills
set author_id = case
  when slug = 'gstack-engineering-workflow' then 'garry-tan'
  when slug = 'google-stitch-design-skills' then 'google-labs'
  else author_id
end
where author_id is null;

update public.authors
set
  avatar_path = case
    when id = 'garry-tan' then 'garry-tan.png'
    when id = 'google-labs' then 'google-labs.png'
    else avatar_path
  end,
  avatar_url = case
    when id = 'garry-tan' then 'https://github.com/garrytan.png'
    when id = 'google-labs' then 'https://github.com/google-labs-code.png'
    else avatar_url
  end,
  updated_at = now()
where id in ('garry-tan', 'google-labs');

delete from public.skills
where visibility = 'public'
  and owner_id is null
  and author_id is null;

create index if not exists skills_author_id_idx on public.skills(author_id);

grant select (id, name, handle, icon, domain, glow_class, bio, focus, website_url, verified, avatar_path, avatar_url)
  on public.authors to anon, authenticated;
