begin;

-- The files were reviewed in Storage before this migration. Keep the object
-- checks in the transaction so a renamed or incomplete upload cannot publish.
do $$
begin
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'skill-artifacts'
      and name = 'taste-skill-brutalist-skill/v2.0.0/SKILL.md'
      and (metadata ->> 'size')::bigint = 8456
  ) then raise exception 'brutalist_skill_artifact_not_ready'; end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'skill-artifacts'
      and name = 'taste-skill-brandkit/v2.0.0/SKILL.md'
      and (metadata ->> 'size')::bigint = 15992
  ) then raise exception 'brandkit_skill_artifact_not_ready'; end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'skill-artifacts'
      and name = 'taste-skill-imagegen-frontend-mobile/v2.0.0/SKILL.md'
      and (metadata ->> 'size')::bigint = 40326
  ) then raise exception 'mobile_imagegen_skill_artifact_not_ready'; end if;
end;
$$;

insert into public.skills (
  slug, title, description, domain, status, compatible_clients,
  license_spdx, visibility, author_id, category
)
values
  (
    'taste-skill-brutalist-skill',
    'Industrial Brutalist UI',
    'Build raw mechanical interfaces that combine Swiss typographic print, rigid grids, extreme scale contrast, utilitarian color, and tactical terminal aesthetics.',
    'design', 'draft', array['Codex', 'Claude Code', 'Cursor', 'Antigravity'],
    'MIT', 'public', 'leonxlnx', 'design'
  ),
  (
    'taste-skill-brandkit',
    'Brandkit',
    'Create premium brand-guideline boards, logo systems, identity decks, visual worlds, art-directed mockups, and presentation-ready brand systems.',
    'design', 'draft', array['Codex', 'Claude Code', 'Cursor', 'Antigravity'],
    'MIT', 'public', 'leonxlnx', 'design'
  ),
  (
    'imagegen-frontend-mobile',
    'Imagegen Frontend Mobile',
    'Create premium, app-native mobile screen concepts and flows for iOS, Android, and cross-platform products with readable hierarchy and consistent visual direction.',
    'design', 'draft', array['Codex', 'Claude Code', 'Cursor', 'Antigravity'],
    'MIT', 'public', 'leonxlnx', 'design'
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  domain = excluded.domain,
  compatible_clients = excluded.compatible_clients,
  license_spdx = excluded.license_spdx,
  visibility = excluded.visibility,
  author_id = excluded.author_id,
  category = excluded.category,
  updated_at = now();

insert into public.skill_versions (
  skill_id, version, content_md, scan_status, scan_summary,
  skill_md_bucket, skill_md_path, skill_md_size_bytes,
  skill_md_hash, skill_md_verified_at
)
select
  s.id,
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
  artifact.skill_md_path,
  artifact.size_bytes,
  artifact.content_hash,
  now()
from public.skills s
join (values
  ('taste-skill-brutalist-skill', 'taste-skill-brutalist-skill/v2.0.0/SKILL.md', 8456::bigint, 'fffbaac8597f07679e9d87145533567658aedba3b5eca6f16a7075a333048caa'),
  ('taste-skill-brandkit', 'taste-skill-brandkit/v2.0.0/SKILL.md', 15992::bigint, 'b0c4837e1bd140ca816ae54948754ddd2ac1e2a4d3619363777a80caf00b2ede'),
  ('imagegen-frontend-mobile', 'taste-skill-imagegen-frontend-mobile/v2.0.0/SKILL.md', 40326::bigint, '8a33389979f3074fa0926678e266ad2eb9234624472254469fc1ad916b9caa24')
) as artifact(slug, skill_md_path, size_bytes, content_hash)
  on artifact.slug = s.slug
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
  skill_version_id, reference_key, storage_bucket, storage_path,
  display_name, mime_type, size_bytes, content_hash, verified_at
)
select
  sv.id, 'LICENSE', 'skill-artifacts',
  'taste-skill-brandkit/v2.0.0/LICENSE', 'LICENSE', 'text/plain', 1065,
  '4575a543ab88dad12ccea7d97e563d0bce5b448b06072e65d3264497dad326df', now()
from public.skill_versions sv
join public.skills s on s.id = sv.skill_id
where s.slug = 'taste-skill-brandkit' and sv.version = '2.0.0'
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
select s.id, copy.locale, copy.title, copy.description
from public.skills s
join (values
  ('taste-skill-brutalist-skill', 'en', 'Industrial Brutalist UI', 'Build raw mechanical interfaces that combine Swiss typographic print, rigid grids, extreme scale contrast, utilitarian color, and tactical terminal aesthetics.'),
  ('taste-skill-brutalist-skill', 'vi', 'Giao diện Brutalist Công nghiệp', 'Xây dựng giao diện cơ khí thô kết hợp typography Thụy Sĩ, lưới cứng, tương phản tỷ lệ mạnh, màu sắc thực dụng và thẩm mỹ terminal chiến thuật.'),
  ('taste-skill-brandkit', 'en', 'Brandkit', 'Create premium brand-guideline boards, logo systems, identity decks, visual worlds, art-directed mockups, and presentation-ready brand systems.'),
  ('taste-skill-brandkit', 'vi', 'Bộ nhận diện thương hiệu', 'Tạo bảng hướng dẫn thương hiệu cao cấp, hệ thống logo, identity deck, thế giới hình ảnh, mockup có art direction và bộ nhận diện sẵn sàng thuyết trình.'),
  ('imagegen-frontend-mobile', 'en', 'Imagegen Frontend Mobile', 'Create premium, app-native mobile screen concepts and flows for iOS, Android, and cross-platform products with readable hierarchy and consistent visual direction.'),
  ('imagegen-frontend-mobile', 'vi', 'Imagegen Giao diện Mobile', 'Tạo concept và luồng màn hình mobile cao cấp cho iOS, Android và ứng dụng đa nền tảng với phân cấp dễ đọc cùng định hướng hình ảnh nhất quán.')
) as copy(slug, locale, title, description)
  on copy.slug = s.slug
on conflict (skill_id, locale) do update
set title = excluded.title, description = excluded.description, updated_at = now();

insert into public.skill_details (
  skill_id, locale, headline, overview,
  feature_one_title, feature_one_description,
  feature_two_title, feature_two_description
)
select
  s.id, copy.locale, copy.headline, copy.overview,
  copy.feature_one_title, copy.feature_one_description,
  copy.feature_two_title, copy.feature_two_description
from public.skills s
join (values
  ('taste-skill-brutalist-skill', 'en', 'Design interfaces with industrial force and typographic discipline', 'Industrial Brutalist UI turns product requirements into rigid, high-contrast visual systems inspired by Swiss print, machinery manuals, and tactical telemetry.', 'Two committed visual modes', 'Choose either Swiss industrial print or tactical CRT telemetry for a project and keep the visual language coherent.', 'Dense but intentional systems', 'Use extreme type scale, visible grids, utilitarian color, and controlled degradation without sacrificing hierarchy.'),
  ('taste-skill-brutalist-skill', 'vi', 'Thiết kế giao diện mạnh mẽ với kỷ luật typography công nghiệp', 'Industrial Brutalist UI biến yêu cầu sản phẩm thành hệ thống hình ảnh cứng cáp, tương phản cao lấy cảm hứng từ in ấn Thụy Sĩ, tài liệu máy móc và telemetry chiến thuật.', 'Hai chế độ hình ảnh rõ ràng', 'Chọn phong cách in công nghiệp Thụy Sĩ hoặc telemetry CRT chiến thuật cho mỗi dự án và giữ ngôn ngữ hình ảnh nhất quán.', 'Mật độ cao nhưng có chủ đích', 'Dùng tỷ lệ chữ cực đoan, lưới hiển thị, màu thực dụng và hiệu ứng xuống cấp có kiểm soát mà không làm mất phân cấp.'),
  ('taste-skill-brandkit', 'en', 'Build a complete visual identity, not a generic moodboard', 'Brandkit directs logo concepting, typography, color, symbolic meaning, mockups, and presentation composition as one coherent identity system.', 'Strategic identity direction', 'Connect every symbol, mark, color, and type decision to a clear brand idea rather than decorative novelty.', 'Presentation-ready output', 'Compose sparse, premium boards and identity decks with consistent mockups, grids, and art-directed imagery.'),
  ('taste-skill-brandkit', 'vi', 'Xây dựng hệ nhận diện hoàn chỉnh, không phải moodboard chung chung', 'Brandkit định hướng ý tưởng logo, typography, màu sắc, ý nghĩa biểu tượng, mockup và bố cục thuyết trình thành một hệ thống nhận diện thống nhất.', 'Định hướng nhận diện chiến lược', 'Gắn mọi biểu tượng, logo, màu và quyết định typography với một ý tưởng thương hiệu rõ ràng thay vì trang trí ngẫu nhiên.', 'Đầu ra sẵn sàng thuyết trình', 'Bố cục bảng thương hiệu và identity deck tinh gọn, cao cấp với mockup, lưới và hình ảnh có art direction nhất quán.'),
  ('imagegen-frontend-mobile', 'en', 'Art-direct premium mobile flows as images', 'Imagegen Frontend Mobile creates app-native screen concepts and multi-screen flows with readable hierarchy, consistent components, and restrained visual direction.', 'Cross-screen consistency', 'Keep navigation, spacing, type, color, and component behavior coherent across every screen in a generated flow.', 'Mobile-native presentation', 'Frame screens in subtle device mockups while preserving legibility and keeping the app content as the primary focus.'),
  ('imagegen-frontend-mobile', 'vi', 'Art direction luồng mobile cao cấp dưới dạng hình ảnh', 'Imagegen Frontend Mobile tạo concept màn hình và luồng nhiều màn hình mang cảm giác ứng dụng thật, phân cấp dễ đọc, component nhất quán và định hướng hình ảnh tiết chế.', 'Nhất quán xuyên màn hình', 'Giữ điều hướng, khoảng cách, typography, màu sắc và hành vi component đồng nhất trong toàn bộ luồng được tạo.', 'Trình bày đúng chất mobile', 'Đặt màn hình trong mockup thiết bị tinh tế nhưng vẫn ưu tiên độ rõ và nội dung ứng dụng.')
) as copy(slug, locale, headline, overview, feature_one_title, feature_one_description, feature_two_title, feature_two_description)
  on copy.slug = s.slug
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
select s.id, copy.locale, copy.question, copy.answer, copy.sort_order, true
from public.skills s
join (values
  ('taste-skill-brutalist-skill', 'en', 'When should I use Industrial Brutalist UI?', 'Use it for editorial sites, portfolios, dashboards, and technical products that benefit from rigid grids, strong typography, and an intentionally mechanical tone.', 1),
  ('taste-skill-brutalist-skill', 'en', 'How do I retrieve the skill?', 'Add the skill to your library, connect OceanSkill MCP, then call get_skill_md for taste-skill-brutalist-skill.', 2),
  ('taste-skill-brutalist-skill', 'vi', 'Khi nào nên dùng Industrial Brutalist UI?', 'Dùng cho website biên tập, portfolio, dashboard và sản phẩm kỹ thuật phù hợp với lưới cứng, typography mạnh và sắc thái cơ khí có chủ đích.', 1),
  ('taste-skill-brutalist-skill', 'vi', 'Làm sao lấy nội dung skill?', 'Thêm skill vào thư viện, kết nối OceanSkill MCP rồi gọi get_skill_md cho taste-skill-brutalist-skill.', 2),
  ('taste-skill-brandkit', 'en', 'What is Brandkit best used for?', 'Use it for identity-system exploration, logo directions, brand-guideline boards, premium mockups, and presentation-ready visual worlds.', 1),
  ('taste-skill-brandkit', 'en', 'Does Brandkit include a reference file?', 'Yes. Retrieve SKILL.md first, then call get_skill_reference with LICENSE only when that file is needed.', 2),
  ('taste-skill-brandkit', 'vi', 'Brandkit phù hợp nhất với việc gì?', 'Dùng cho khám phá hệ nhận diện, định hướng logo, bảng hướng dẫn thương hiệu, mockup cao cấp và thế giới hình ảnh sẵn sàng thuyết trình.', 1),
  ('taste-skill-brandkit', 'vi', 'Brandkit có file tham chiếu không?', 'Có. Hãy lấy SKILL.md trước, sau đó chỉ gọi get_skill_reference với LICENSE khi cần file đó.', 2),
  ('imagegen-frontend-mobile', 'en', 'Does this skill generate production code?', 'No. It art-directs and generates mobile interface images and multi-screen flow concepts; it does not write application code.', 1),
  ('imagegen-frontend-mobile', 'en', 'How do I retrieve the skill?', 'Add the skill to your library, connect OceanSkill MCP, then call get_skill_md for imagegen-frontend-mobile.', 2),
  ('imagegen-frontend-mobile', 'vi', 'Skill này có tạo code production không?', 'Không. Skill dùng để art direction và tạo hình ảnh giao diện mobile cùng concept luồng nhiều màn hình; skill không viết code ứng dụng.', 1),
  ('imagegen-frontend-mobile', 'vi', 'Làm sao lấy nội dung skill?', 'Thêm skill vào thư viện, kết nối OceanSkill MCP rồi gọi get_skill_md cho imagegen-frontend-mobile.', 2)
) as copy(slug, locale, question, answer, sort_order)
  on copy.slug = s.slug
on conflict (skill_id, locale, sort_order) do update
set
  question = excluded.question,
  answer = excluded.answer,
  is_published = excluded.is_published,
  updated_at = now();

update public.skills
set status = 'active', current_version = '2.0.0', updated_at = now()
where slug in (
  'taste-skill-brutalist-skill',
  'taste-skill-brandkit',
  'imagegen-frontend-mobile'
);

do $$
begin
  if (
    select count(*) from public.skills
    where slug in (
      'taste-skill-brutalist-skill',
      'taste-skill-brandkit',
      'imagegen-frontend-mobile'
    )
      and status = 'active'
      and visibility = 'public'
      and current_version = '2.0.0'
  ) <> 3 then raise exception 'split_taste_skills_not_ready'; end if;
end;
$$;

-- Keep the platform collection and replace its membership with the five
-- specialized taste skills, including the two that were already published.
delete from public.skill_collection_items
where collection_id = (
  select id from public.skill_collections
  where collection_type = 'platform' and slug = 'taste-skill'
);

insert into public.skill_collection_items (collection_id, skill_id, position)
select c.id, s.id, requested.position
from public.skill_collections c
join (values
  ('taste-skill-gpt-tasteskill', 0),
  ('taste-skill-redesign-skill', 1),
  ('taste-skill-brutalist-skill', 2),
  ('taste-skill-brandkit', 3),
  ('imagegen-frontend-mobile', 4)
) as requested(slug, position) on true
join public.skills s on s.slug = requested.slug
where c.collection_type = 'platform' and c.slug = 'taste-skill';

do $$
begin
  if (
    select count(*)
    from public.skill_collection_items i
    join public.skill_collections c on c.id = i.collection_id
    where c.collection_type = 'platform' and c.slug = 'taste-skill'
  ) <> 5 then raise exception 'taste_skill_collection_membership_incomplete'; end if;
end;
$$;

-- Retire the former monolithic skill and remove its usage trail. Delete the
-- ledger link first because that foreign key intentionally uses RESTRICT.
delete from public.mcp_call_events
where request_id in (
  select ue.request_id
  from public.usage_events ue
  join public.skills s on s.id = ue.skill_id
  where s.slug = 'taste-skill'
);

-- Removing the historical usage ledger row must not refund the already spent
-- credit. Preserve the net balance with an adjustment that has no skill or
-- usage-event reference, then remove the obsolete usage-linked ledger row.
insert into public.credit_ledger (
  user_id, units, entry_type, idempotency_key, note
)
select
  ue.user_id,
  -sum(ue.units),
  'adjustment',
  'retire:taste-skill:preserve-spent-credit',
  'Preserve spent credit while removing retired taste-skill usage history'
from public.usage_events ue
join public.skills s on s.id = ue.skill_id
where s.slug = 'taste-skill' and ue.status = 'succeeded'
group by ue.user_id
on conflict (idempotency_key) do nothing;

delete from public.credit_ledger
where usage_event_id in (
  select ue.id
  from public.usage_events ue
  join public.skills s on s.id = ue.skill_id
  where s.slug = 'taste-skill'
);

delete from public.usage_events
where skill_id = (select id from public.skills where slug = 'taste-skill');

delete from public.skills where slug = 'taste-skill';

commit;
