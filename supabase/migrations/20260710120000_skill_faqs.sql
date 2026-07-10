create table if not exists public.skill_faqs (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 300),
  answer text not null check (char_length(answer) between 1 and 1200),
  sort_order smallint not null check (sort_order between 1 and 3),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (skill_id, sort_order)
);

create index if not exists skill_faqs_skill_order_idx on public.skill_faqs(skill_id, sort_order);
alter table public.skill_faqs enable row level security;
drop policy if exists skill_faqs_select_public on public.skill_faqs;
create policy skill_faqs_select_public on public.skill_faqs for select to anon, authenticated using (is_published = true);
revoke all on public.skill_faqs from anon, authenticated;
grant select on public.skill_faqs to anon, authenticated;

insert into public.skill_faqs (skill_id, question, answer, sort_order)
select s.id,
  format('What is %s used for?', s.title),
  format('%s is available through the authenticated nskill MCP connection and follows the published skill metadata and license.', s.title),
  1
from public.skills s
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, sort_order) do nothing;

insert into public.skill_faqs (skill_id, question, answer, sort_order)
select s.id,
  format('How do I connect %s to my agent?', s.title),
  'Create an MCP key in Dashboard -> MCP Key, add it to your client configuration, restart the client, and call the skill through nskill.',
  2
from public.skills s
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, sort_order) do nothing;

insert into public.skill_faqs (skill_id, question, answer, sort_order)
select s.id,
  format('What access does %s require?', s.title),
  'The public catalog exposes metadata only. Protected SKILL.md content is returned only to an authenticated MCP request with an active permission and a passed scan.',
  3
from public.skills s
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, sort_order) do nothing;
