create table if not exists public.skill_translations (
  skill_id uuid not null references public.skills(id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  title text not null check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) between 1 and 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (skill_id, locale)
);

create index if not exists skill_translations_locale_idx
  on public.skill_translations(locale);

alter table public.skill_translations enable row level security;

drop policy if exists skill_translations_select_public on public.skill_translations;
create policy skill_translations_select_public on public.skill_translations for select
to anon, authenticated
using (
  exists (
    select 1 from public.skills s
    where s.id = skill_id and s.status = 'active' and s.visibility = 'public'
  )
);

revoke all on public.skill_translations from anon, authenticated;
grant select on public.skill_translations to anon, authenticated;

insert into public.skill_translations (skill_id, locale, title, description)
select id, 'en', title, description
from public.skills
where status = 'active' and visibility = 'public'
on conflict (skill_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

insert into public.skill_translations (skill_id, locale, title, description)
select s.id, 'vi', v.title, v.description
from public.skills s
join (values
  ('algorithmic-art', 'algorithmic-art', 'Tạo nghệ thuật sinh bằng p5.js với seed có thể tái tạo, tham số điều khiển, hệ màu rõ ràng và sketch tương tác sẵn sàng xuất bản.'),
  ('brand-guidelines', 'brand-guidelines', 'Áp dụng nhất quán palette màu, typography, spacing và quy tắc nhận diện chính thức của Anthropic cho tài liệu, slide, website và tài sản thương hiệu.'),
  ('canvas-design', 'canvas-design', 'Tạo poster, minh họa và bố cục tĩnh nguyên bản cho PNG hoặc PDF bằng phân cấp, typography, màu sắc và tư duy canvas có chủ đích.'),
  ('frontend-design', 'frontend-design', 'Thiết kế và triển khai giao diện production khác biệt với định hướng thị giác rõ ràng, component chỉn chu, responsive và tương tác có chủ đích.'),
  ('gstack', 'gstack', 'Vận hành workflow kỹ thuật AI trọn vẹn từ khám phá sản phẩm, lập kế hoạch, review triển khai, browser QA, bảo mật, tài liệu đến phát hành.'),
  ('stitch-skills', 'stitch-skills', 'Dùng workflow Google Stitch để tạo màn hình, trích xuất design system, chuyển thiết kế thành component React hoặc React Native và quản lý asset thị giác.'),
  ('taste-skill', 'taste-skill', 'Biến landing page, portfolio và redesign thành trải nghiệm frontend có cá tính bằng cách suy ra ngôn ngữ thiết kế phù hợp và loại bỏ mẫu UI AI chung chung.')
) as v(slug, title, description)
on v.slug = s.slug
on conflict (skill_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = now();

alter table public.skill_details
  add column if not exists locale text not null default 'vi'
  check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$');

alter table public.skill_details
  drop constraint if exists skill_details_pkey;

alter table public.skill_details
  add primary key (skill_id, locale);

insert into public.skill_details (skill_id, locale, headline, overview, feature_one_title, feature_one_description, feature_two_title, feature_two_description)
select s.id, 'en', v.headline, v.overview, v.feature_one_title, v.feature_one_description, v.feature_two_title, v.feature_two_description
from public.skills s
join (values
  ('algorithmic-art', 'Turn algorithms into visual artwork', 'algorithmic-art helps agents build generative art in p5.js with geometric rules, intentional palettes, and reproducible randomness.', 'Controlled randomness', 'Use seeds and parameters so each result can be reproduced, tuned, and expanded into consistent variants.', 'Interaction and publishing', 'Create sketches with live controls, input response, and export-ready artifacts for sharing.'),
  ('brand-guidelines', 'Keep every asset aligned with Anthropic brand standards', 'brand-guidelines applies Anthropic official color, typography, and presentation rules across documents, slides, websites, and communication assets.', 'Correct color and typography', 'Choose the right brand palette and type system so outputs stay visually consistent with Anthropic.', 'Consistency across formats', 'Keep the same visual language while moving content between documents, decks, and digital interfaces.'),
  ('canvas-design', 'Create static designs with clear composition and personality', 'canvas-design guides agents to create posters, illustrations, and original visual compositions for PNG or PDF output with systematic design thinking.', 'Intentional composition', 'Build hierarchy, rhythm, whitespace, and typography around the message instead of relying on generic templates.', 'Ready-to-use output', 'Finish canvas artwork in a format suitable for image or PDF export with strong presentation quality.'),
  ('frontend-design', 'Build distinctive production-ready interfaces', 'frontend-design helps agents turn product requests into responsive interfaces with clear art direction and polished interactive states.', 'Distinct visual language', 'Select typography, color, layout, and imagery that fit the product instead of repeating common AI interface patterns.', 'Complete implementation', 'Create responsive components, interaction states, and finishing details ready for real applications.'),
  ('gstack', 'Run a complete AI-assisted software delivery cycle', 'gstack organizes work from product discovery, technical planning, and review through QA, security, documentation, and release.', 'Plan and validate', 'Turn ideas into clear scope, review architecture, and check assumptions before implementation.', 'Quality before release', 'Combine review, browser QA, security checks, and documentation sync before shipping changes.'),
  ('stitch-skills', 'Move from Stitch design to structured interfaces', 'stitch-skills provides workflows to generate screens, extract design systems, and convert Google Stitch designs into React or React Native components.', 'Reusable design systems', 'Analyze screens and collect typography, color, spacing, and component rules into a unified design source.', 'Design-to-code conversion', 'Generate or sync React and React Native components from Stitch designs and related assets.'),
  ('taste-skill', 'Remove generic AI UI from products', 'taste-skill helps agents read context, infer a fitting design language, and create landing pages, portfolios, or redesigns with distinct taste.', 'Design direction reasoning', 'Tune variation, motion, and density from the brief instead of applying one fixed style to every project.', 'Anti-slop control', 'Detect and remove layouts, typography, cards, and effects that feel like generic AI-generated UI.')
) as v(slug, headline, overview, feature_one_title, feature_one_description, feature_two_title, feature_two_description)
on v.slug = s.slug
on conflict (skill_id, locale) do update set
  headline = excluded.headline,
  overview = excluded.overview,
  feature_one_title = excluded.feature_one_title,
  feature_one_description = excluded.feature_one_description,
  feature_two_title = excluded.feature_two_title,
  feature_two_description = excluded.feature_two_description,
  updated_at = now();

alter table public.skill_faqs
  add column if not exists locale text not null default 'en'
  check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$');

alter table public.skill_faqs
  drop constraint if exists skill_faqs_skill_id_sort_order_key;

create unique index if not exists skill_faqs_skill_locale_order_key
  on public.skill_faqs(skill_id, locale, sort_order);

insert into public.skill_faqs (skill_id, locale, question, answer, sort_order)
select s.id,
  'vi',
  format('%s dùng để làm gì?', coalesce(t.title, s.title)),
  format('%s khả dụng qua kết nối nskill MCP đã xác thực và tuân theo metadata cùng giấy phép đã công bố.', coalesce(t.title, s.title)),
  1
from public.skills s
left join public.skill_translations t on t.skill_id = s.id and t.locale = 'vi'
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, locale, sort_order) do nothing;

insert into public.skill_faqs (skill_id, locale, question, answer, sort_order)
select s.id,
  'vi',
  format('Làm sao kết nối %s với agent?', coalesce(t.title, s.title)),
  'Tạo MCP key trong Dashboard -> MCP Key, thêm key vào cấu hình client, khởi động lại client và gọi skill qua nskill.',
  2
from public.skills s
left join public.skill_translations t on t.skill_id = s.id and t.locale = 'vi'
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, locale, sort_order) do nothing;

insert into public.skill_faqs (skill_id, locale, question, answer, sort_order)
select s.id,
  'vi',
  format('%s cần quyền truy cập nào?', coalesce(t.title, s.title)),
  'Catalog công khai chỉ hiển thị metadata. Nội dung SKILL.md được bảo vệ chỉ trả về cho MCP request đã xác thực, có quyền sử dụng active và vượt qua kiểm tra scan.',
  3
from public.skills s
left join public.skill_translations t on t.skill_id = s.id and t.locale = 'vi'
where s.status = 'active' and s.visibility = 'public'
on conflict (skill_id, locale, sort_order) do nothing;
