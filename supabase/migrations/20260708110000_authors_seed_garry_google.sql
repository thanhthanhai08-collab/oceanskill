create table if not exists public.authors (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  handle text not null default '',
  icon text not null default 'person',
  domain text not null default 'agent-first',
  glow_class text not null default 'from-primary-container via-secondary-container to-surface-container-high',
  bio text not null default '',
  focus text[] not null default '{}',
  website_url text,
  verified boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists authors_domain_idx on public.authors(domain);

alter table public.authors enable row level security;

drop policy if exists authors_select_verified on public.authors;
create policy authors_select_verified on public.authors
for select to anon, authenticated
using (verified = true);

grant select on public.authors to anon, authenticated;

insert into public.authors (id, name, handle, icon, domain, glow_class, bio, focus, website_url, verified)
values
  (
    'garry-tan',
    'Garry Tan',
    '@garrytan',
    'rocket_launch',
    'agent-first',
    'from-primary-container via-secondary-container to-surface-container-high',
    'Founder, investor, and builder behind gstack, an opinionated workflow for AI-assisted engineering teams.',
    array['gstack', 'Engineering workflow', 'AI agents'],
    'https://github.com/garrytan/gstack',
    true
  ),
  (
    'google-labs',
    'Google Labs',
    '@googlelabs',
    'palette',
    'design',
    'from-secondary-container via-tertiary-container to-surface-container-high',
    'Google Labs publishes Stitch skills for generating designs, extracting design systems, and building UI workflows for agent clients.',
    array['Stitch', 'Design systems', 'UI generation'],
    'https://github.com/google-labs-code/stitch-skills',
    true
  )
on conflict (id) do update set
  name = excluded.name,
  handle = excluded.handle,
  icon = excluded.icon,
  domain = excluded.domain,
  glow_class = excluded.glow_class,
  bio = excluded.bio,
  focus = excluded.focus,
  website_url = excluded.website_url,
  verified = excluded.verified,
  updated_at = now();
