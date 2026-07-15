create table public.author_translations (
  author_id text not null references public.authors(id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  bio text not null check (char_length(bio) between 1 and 1000),
  focus text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (author_id, locale)
);

create index author_translations_locale_idx on public.author_translations(locale);

alter table public.author_translations enable row level security;

create policy author_translations_select_verified
on public.author_translations for select
to anon, authenticated
using (
  exists (
    select 1 from public.authors
    where authors.id = author_id and authors.verified = true
  )
);

revoke all on public.author_translations from anon, authenticated;
grant select on public.author_translations to anon, authenticated;

insert into public.author_translations (author_id, locale, bio, focus)
select id, 'en', bio, focus from public.authors
on conflict (author_id, locale) do update set
  bio = excluded.bio,
  focus = excluded.focus,
  updated_at = now();

insert into public.author_translations (author_id, locale, bio, focus)
values
  ('anthropic', 'vi', 'Anthropic phát hành các skill dành cho agent, giúp Claude và các coding agent tương thích thực hiện những quy trình chuyên biệt.', array['AI skill', 'Claude', 'Quy trình agent']),
  ('garry-tan', 'vi', 'Nhà sáng lập, nhà đầu tư và kỹ sư đứng sau gstack, một quy trình có định hướng rõ ràng dành cho các đội ngũ kỹ thuật được AI hỗ trợ.', array['gstack', 'Quy trình kỹ thuật', 'AI agent']),
  ('google-labs', 'vi', 'Google Labs phát hành các Stitch skill để tạo thiết kế, trích xuất design system và xây dựng quy trình giao diện cho các agent client.', array['Stitch', 'Design system', 'Tạo giao diện']),
  ('leonxlnx', 'vi', 'Taste Skill giúp các AI agent tạo ra trải nghiệm frontend cao cấp, có cá tính và tránh những mẫu giao diện AI đại trà.', array['Thiết kế frontend', 'Giao diện có cá tính', 'Agent skill'])
on conflict (author_id, locale) do update set
  bio = excluded.bio,
  focus = excluded.focus,
  updated_at = now();
