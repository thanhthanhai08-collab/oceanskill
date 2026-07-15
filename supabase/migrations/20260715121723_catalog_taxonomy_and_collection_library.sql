create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  icon text not null default 'category',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_translations (
  category_slug text not null references public.categories(slug) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null check (char_length(description) between 1 and 500),
  seo_title text not null check (char_length(seo_title) between 1 and 160),
  seo_description text not null check (char_length(seo_description) between 1 and 320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (category_slug, locale)
);

create index category_translations_locale_idx on public.category_translations(locale);

insert into public.categories (slug, icon, sort_order) values
  ('ai-agent', 'smart_toy', 10),
  ('design', 'palette', 20),
  ('development', 'code', 30),
  ('productivity', 'bolt', 40),
  ('research', 'science', 50),
  ('marketing', 'campaign', 60),
  ('security', 'shield', 70);

insert into public.category_translations (category_slug, locale, name, description, seo_title, seo_description) values
  ('ai-agent', 'en', 'AI Agents', 'Skills for agent orchestration, MCP workflows, and reliable AI-assisted execution.', 'AI Agent Skills', 'Discover AI agent skills for orchestration, MCP workflows, automation, and dependable agent execution.'),
  ('ai-agent', 'vi', 'AI Agent', 'Các skill dành cho điều phối agent, quy trình MCP và thực thi có AI hỗ trợ ổn định.', 'Skill AI Agent', 'Khám phá các skill AI Agent cho điều phối, quy trình MCP, tự động hóa và thực thi agent ổn định.'),
  ('design', 'en', 'Design', 'Skills for interface design, visual systems, prototyping, and design-to-code workflows.', 'Design Skills', 'Explore design skills for UI, visual systems, prototyping, frontend quality, and design-to-code workflows.'),
  ('design', 'vi', 'Thiết kế', 'Các skill dành cho thiết kế giao diện, hệ thống thị giác, tạo mẫu và quy trình design-to-code.', 'Skill thiết kế', 'Khám phá skill thiết kế UI, hệ thống thị giác, tạo mẫu, chất lượng frontend và design-to-code.'),
  ('development', 'en', 'Development', 'Skills that improve software planning, implementation, testing, and delivery.', 'Development Skills', 'Find development skills for planning, coding, testing, debugging, and shipping reliable software.'),
  ('development', 'vi', 'Phát triển', 'Các skill cải thiện việc lập kế hoạch, triển khai, kiểm thử và phát hành phần mềm.', 'Skill phát triển phần mềm', 'Tìm skill phát triển cho lập kế hoạch, viết mã, kiểm thử, gỡ lỗi và phát hành phần mềm ổn định.'),
  ('productivity', 'en', 'Productivity', 'Skills for focused work, repeatable operations, and efficient knowledge workflows.', 'Productivity Skills', 'Browse productivity skills for focused work, repeatable operations, and efficient knowledge workflows.'),
  ('productivity', 'vi', 'Năng suất', 'Các skill dành cho làm việc tập trung, vận hành lặp lại và quy trình tri thức hiệu quả.', 'Skill năng suất', 'Khám phá skill năng suất cho làm việc tập trung, vận hành lặp lại và quy trình tri thức hiệu quả.'),
  ('research', 'en', 'Research', 'Skills for finding, validating, synthesizing, and communicating reliable information.', 'Research Skills', 'Discover research skills for finding, validating, synthesizing, and communicating reliable information.'),
  ('research', 'vi', 'Nghiên cứu', 'Các skill dành cho tìm kiếm, xác thực, tổng hợp và trình bày thông tin đáng tin cậy.', 'Skill nghiên cứu', 'Khám phá skill nghiên cứu để tìm kiếm, xác thực, tổng hợp và trình bày thông tin đáng tin cậy.'),
  ('marketing', 'en', 'Marketing', 'Skills for market insight, positioning, content, campaigns, and growth workflows.', 'Marketing Skills', 'Explore marketing skills for market insight, positioning, content, campaigns, and sustainable growth workflows.'),
  ('marketing', 'vi', 'Tiếp thị', 'Các skill dành cho insight thị trường, định vị, nội dung, chiến dịch và quy trình tăng trưởng.', 'Skill tiếp thị', 'Khám phá skill tiếp thị cho insight thị trường, định vị, nội dung, chiến dịch và tăng trưởng bền vững.'),
  ('security', 'en', 'Security', 'Skills for secure engineering, risk discovery, validation, and remediation workflows.', 'Security Skills', 'Find security skills for secure engineering, risk discovery, validation, and remediation workflows.'),
  ('security', 'vi', 'Bảo mật', 'Các skill dành cho kỹ thuật an toàn, phát hiện, xác thực và khắc phục rủi ro.', 'Skill bảo mật', 'Tìm skill bảo mật cho kỹ thuật an toàn, phát hiện, xác thực và khắc phục rủi ro.' );

alter table public.skills add column category text;
alter table public.authors add column category text;

update public.skills set category = case when domain = 'agent-first' then 'ai-agent' else domain end;
update public.authors set category = case when domain = 'agent-first' then 'ai-agent' else domain end;

alter table public.skills alter column category set not null;
alter table public.authors alter column category set not null;
alter table public.skills drop constraint if exists skills_domain_check;
alter table public.skills add constraint skills_category_fkey foreign key (category) references public.categories(slug) on update cascade;
alter table public.authors add constraint authors_category_fkey foreign key (category) references public.categories(slug) on update cascade;

create index skills_category_status_visibility_idx on public.skills(category, status, visibility);
create index authors_category_idx on public.authors(category);

create or replace function private.sync_category_compatibility()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.category := coalesce(new.category, case when new.domain = 'agent-first' then 'ai-agent' else new.domain end);
    new.domain := coalesce(new.domain, new.category);
  elsif new.category is distinct from old.category and new.domain is not distinct from old.domain then
    new.domain := new.category;
  elsif new.domain is distinct from old.domain and new.category is not distinct from old.category then
    new.category := case when new.domain = 'agent-first' then 'ai-agent' else new.domain end;
  elsif new.category is distinct from new.domain then
    new.domain := new.category;
  end if;
  return new;
end;
$$;

create trigger skills_sync_category_compatibility
before insert or update of category, domain on public.skills
for each row execute function private.sync_category_compatibility();

create trigger authors_sync_category_compatibility
before insert or update of category, domain on public.authors
for each row execute function private.sync_category_compatibility();

comment on column public.skills.domain is 'Deprecated compatibility alias. Use category.';
comment on column public.authors.domain is 'Deprecated compatibility alias. Use category.';

create table public.tags (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_en text not null check (char_length(name_en) between 1 and 80),
  name_vi text not null check (char_length(name_vi) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.skill_tags (
  skill_id uuid not null references public.skills(id) on delete cascade,
  tag_slug text not null references public.tags(slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (skill_id, tag_slug)
);

create index skill_tags_tag_skill_idx on public.skill_tags(tag_slug, skill_id);

insert into public.tags (slug, name_en, name_vi) values
  ('ai-agent', 'AI Agent', 'AI Agent'),
  ('automation', 'Automation', 'Tự động hóa'),
  ('design-system', 'Design System', 'Hệ thống thiết kế'),
  ('frontend', 'Frontend', 'Frontend'),
  ('mcp', 'MCP', 'MCP'),
  ('productivity', 'Productivity', 'Năng suất'),
  ('research', 'Research', 'Nghiên cứu'),
  ('security', 'Security', 'Bảo mật'),
  ('ui-ux', 'UI/UX', 'UI/UX');

insert into public.skill_tags (skill_id, tag_slug)
select id, case when category = 'ai-agent' then 'ai-agent' else category end
from public.skills
where category in ('ai-agent', 'productivity', 'research', 'security')
on conflict do nothing;

insert into public.skill_tags (skill_id, tag_slug)
select id, 'frontend' from public.skills where category = 'design'
on conflict do nothing;

insert into public.skill_tags (skill_id, tag_slug)
select id, 'ui-ux' from public.skills where category = 'design'
on conflict do nothing;

alter table public.categories enable row level security;
alter table public.category_translations enable row level security;
alter table public.tags enable row level security;
alter table public.skill_tags enable row level security;

create policy categories_select_public on public.categories for select to anon, authenticated using (true);
create policy category_translations_select_public on public.category_translations for select to anon, authenticated using (true);
create policy tags_select_public on public.tags for select to anon, authenticated using (true);
create policy skill_tags_select_public on public.skill_tags for select to anon, authenticated
using (exists (select 1 from public.skills s where s.id = skill_id and s.status = 'active' and s.visibility = 'public'));

revoke all on public.categories, public.category_translations, public.tags, public.skill_tags from anon, authenticated;
grant select on public.categories, public.category_translations, public.tags, public.skill_tags to anon, authenticated;
grant select (category) on public.skills to anon, authenticated;
grant select (category) on public.authors to anon, authenticated;
grant insert (category) on public.skills to authenticated;
grant update (category) on public.skills to authenticated;

insert into public.user_collection_library (user_id, collection_id)
select user_id, id from public.skill_collections
on conflict (user_id, collection_id) do nothing;

create or replace function public.create_skill_collection(
  p_name text,
  p_slug text,
  p_description text,
  p_accent text,
  p_skill_ids uuid[]
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_collection_id uuid;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'unauthorized'; end if;
  if char_length(trim(p_name)) not between 1 and 120 then raise exception using errcode = '22023', message = 'invalid_collection_name'; end if;
  if p_slug !~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$' or char_length(p_slug) not between 3 and 80 then raise exception using errcode = '22023', message = 'invalid_collection_slug'; end if;
  if char_length(coalesce(p_description, '')) > 500 then raise exception using errcode = '22023', message = 'invalid_collection_description'; end if;
  if p_accent not in ('primary', 'secondary', 'tertiary') then raise exception using errcode = '22023', message = 'invalid_collection_accent'; end if;
  if coalesce(array_length(p_skill_ids, 1), 0) not between 1 and 100 then raise exception using errcode = '22023', message = 'invalid_collection_skills'; end if;
  if (select count(distinct skill_id) from unnest(p_skill_ids) skill_id) <> array_length(p_skill_ids, 1) then raise exception using errcode = '22023', message = 'duplicate_collection_skills'; end if;

  insert into public.skill_collections (user_id, name, slug, description, accent)
  values (v_user_id, trim(p_name), p_slug, coalesce(p_description, ''), p_accent)
  returning id into v_collection_id;

  insert into public.skill_collection_items (collection_id, skill_id, position)
  select v_collection_id, skill_id, ordinality - 1
  from unnest(p_skill_ids) with ordinality as selected(skill_id, ordinality);

  insert into public.user_collection_library (user_id, collection_id)
  values (v_user_id, v_collection_id);

  return v_collection_id;
end;
$$;

revoke all on function public.create_skill_collection(text, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_skill_collection(text, text, text, text, uuid[]) to authenticated;
