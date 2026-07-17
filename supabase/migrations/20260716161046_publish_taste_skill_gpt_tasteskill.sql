begin;

insert into public.skills (
  slug,
  title,
  description,
  domain,
  status,
  compatible_clients,
  license_spdx,
  visibility,
  author_id,
  category
)
values (
  'taste-skill-gpt-tasteskill',
  'GPT Taste',
  'Design premium, motion-rich interfaces with wide editorial typography, structured AIDA journeys, dense bento layouts, and deliberate GSAP interactions.',
  'design',
  'draft',
  array['Codex', 'Claude Code', 'Cursor', 'Antigravity'],
  'MIT',
  'public',
  'leonxlnx',
  'design'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  domain = excluded.domain,
  status = public.skills.status,
  compatible_clients = excluded.compatible_clients,
  license_spdx = excluded.license_spdx,
  visibility = excluded.visibility,
  author_id = excluded.author_id,
  category = excluded.category,
  updated_at = now();

insert into public.skill_versions (
  skill_id,
  version,
  content_md,
  scan_status,
  scan_summary,
  skill_md_bucket,
  skill_md_path,
  skill_md_size_bytes,
  skill_md_hash,
  skill_md_verified_at
)
select
  id,
  '2.0.0',
  '',
  'passed',
  jsonb_build_object(
    'pipeline', 'manual-storage-publish-v2',
    'storage_review', 'approved-before-publish',
    'checks', jsonb_build_array('storage_reference_downloaded', 'sha256_verified'),
    'published_at', now()
  ),
  'skill-artifacts',
  'taste-skill-gpt-tasteskill/v2.0.0/SKILL.md',
  7857,
  '2e64c269953f2656c21bf5a0fa6b4568e82fe0c72b36e8f84758e090349966a5',
  now()
from public.skills
where slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, version) do update
set
  content_md = excluded.content_md,
  scan_status = excluded.scan_status,
  scan_summary = excluded.scan_summary,
  skill_md_bucket = excluded.skill_md_bucket,
  skill_md_path = excluded.skill_md_path,
  skill_md_size_bytes = excluded.skill_md_size_bytes,
  skill_md_hash = excluded.skill_md_hash,
  skill_md_verified_at = excluded.skill_md_verified_at;

insert into public.skill_reference_files (
  skill_version_id,
  reference_key,
  storage_bucket,
  storage_path,
  display_name,
  mime_type,
  size_bytes,
  content_hash,
  verified_at
)
select
  sv.id,
  'LICENSE',
  'skill-artifacts',
  'taste-skill-gpt-tasteskill/v2.0.0/LICENSE',
  'LICENSE',
  'text/plain',
  1065,
  '4575a543ab88dad12ccea7d97e563d0bce5b448b06072e65d3264497dad326df',
  now()
from public.skill_versions sv
join public.skills s on s.id = sv.skill_id
where s.slug = 'taste-skill-gpt-tasteskill'
  and sv.version = '2.0.0'
on conflict (skill_version_id, reference_key) do update
set
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  display_name = excluded.display_name,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  content_hash = excluded.content_hash,
  verified_at = excluded.verified_at;

insert into public.skill_translations (skill_id, locale, title, description)
select id, 'en', 'GPT Taste',
  'Design premium, motion-rich interfaces with wide editorial typography, structured AIDA journeys, dense bento layouts, and deliberate GSAP interactions.'
from public.skills
where slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, locale) do update
set title = excluded.title, description = excluded.description, updated_at = now();

insert into public.skill_translations (skill_id, locale, title, description)
select id, 'vi', 'GPT Taste',
  'Thiết kế giao diện cao cấp giàu chuyển động với typography biên tập khổ rộng, hành trình AIDA rõ ràng, bento grid chặt chẽ và tương tác GSAP có chủ đích.'
from public.skills
where slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, locale) do update
set title = excluded.title, description = excluded.description, updated_at = now();

insert into public.skill_details (
  skill_id, locale, headline, overview,
  feature_one_title, feature_one_description,
  feature_two_title, feature_two_description
)
select
  id,
  'en',
  'Engineer cinematic interfaces with disciplined motion',
  'GPT Taste turns product briefs into expressive frontend systems with wide type, deliberate pacing, dense layouts, and production-grade GSAP motion.',
  'Editorial structure',
  'Keep hero typography broad and readable while organizing the full page around a clear Attention, Interest, Desire, and Action journey.',
  'Advanced motion systems',
  'Build purposeful ScrollTrigger sequences, pinned sections, scrubbing reveals, and responsive hover physics instead of decorative animation.'
from public.skills
where slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, locale) do update
set
  headline = excluded.headline,
  overview = excluded.overview,
  feature_one_title = excluded.feature_one_title,
  feature_one_description = excluded.feature_one_description,
  feature_two_title = excluded.feature_two_title,
  feature_two_description = excluded.feature_two_description,
  updated_at = now();

insert into public.skill_details (
  skill_id, locale, headline, overview,
  feature_one_title, feature_one_description,
  feature_two_title, feature_two_description
)
select
  id,
  'vi',
  'Xây dựng giao diện điện ảnh với chuyển động có kỷ luật',
  'GPT Taste biến brief sản phẩm thành hệ thống frontend giàu cá tính bằng typography rộng, nhịp điệu rõ ràng, bố cục dày và chuyển động GSAP sẵn sàng cho production.',
  'Cấu trúc biên tập',
  'Giữ typography hero rộng, dễ đọc và tổ chức toàn trang theo hành trình Attention, Interest, Desire và Action rõ ràng.',
  'Hệ thống chuyển động nâng cao',
  'Xây dựng chuỗi ScrollTrigger, section ghim, hiệu ứng reveal theo scroll và hover physics có mục đích thay vì animation trang trí.'
from public.skills
where slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, locale) do update
set
  headline = excluded.headline,
  overview = excluded.overview,
  feature_one_title = excluded.feature_one_title,
  feature_one_description = excluded.feature_one_description,
  feature_two_title = excluded.feature_two_title,
  feature_two_description = excluded.feature_two_description,
  updated_at = now();

insert into public.skill_faqs (skill_id, locale, question, answer, sort_order, is_published)
select s.id, f.locale, f.question, f.answer, f.sort_order, true
from public.skills s
cross join (values
  ('en', 'What is GPT Taste best used for?', 'Use it for premium landing pages, portfolios, product websites, and redesigns that need strong editorial composition and advanced GSAP motion.', 1),
  ('en', 'Does GPT Taste require GSAP?', 'The skill is designed around real GSAP and ScrollTrigger implementations. Confirm the project dependencies and performance budget before adding motion.', 2),
  ('en', 'How do I retrieve the skill?', 'Connect an authenticated nskill MCP key and call get_skill_md for taste-skill-gpt-tasteskill. Use get_skill_reference only when you need the LICENSE file.', 3),
  ('vi', 'GPT Taste phù hợp nhất với việc gì?', 'Dùng skill cho landing page cao cấp, portfolio, website sản phẩm và các dự án redesign cần bố cục biên tập mạnh cùng chuyển động GSAP nâng cao.', 1),
  ('vi', 'GPT Taste có bắt buộc dùng GSAP không?', 'Skill được thiết kế xoay quanh triển khai GSAP và ScrollTrigger thực tế. Hãy kiểm tra dependency và ngân sách hiệu năng của dự án trước khi thêm chuyển động.', 2),
  ('vi', 'Làm sao lấy nội dung skill?', 'Kết nối MCP key nskill đã xác thực và gọi get_skill_md cho taste-skill-gpt-tasteskill. Chỉ dùng get_skill_reference khi cần file LICENSE.', 3)
) as f(locale, question, answer, sort_order)
where s.slug = 'taste-skill-gpt-tasteskill'
on conflict (skill_id, locale, sort_order) do update
set
  question = excluded.question,
  answer = excluded.answer,
  is_published = excluded.is_published,
  updated_at = now();

update public.skills
set status = 'active', current_version = '2.0.0', updated_at = now()
where slug = 'taste-skill-gpt-tasteskill';

commit;
