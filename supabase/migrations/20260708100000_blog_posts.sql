create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  locale text not null check (locale in ('vi', 'en')),
  title text not null check (char_length(title) between 1 and 220),
  excerpt text not null default '',
  category text not null default 'Guide',
  author_name text not null default 'OceanSkill',
  icon text not null default 'article',
  glow_class text not null default 'from-primary-container/70 via-tertiary-container/30 to-background',
  reading_minutes integer not null default 5 check (reading_minutes > 0),
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale),
  check (jsonb_typeof(sections) = 'array')
);

create index if not exists blog_posts_locale_status_published_idx
  on public.blog_posts(locale, status, published_at desc);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function private.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_select_published on public.blog_posts;
create policy blog_posts_select_published on public.blog_posts
for select to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

grant select on public.blog_posts to anon, authenticated;

insert into public.blog_posts
  (slug, locale, title, excerpt, category, author_name, icon, glow_class, reading_minutes, status, published_at, sections)
values
  (
    'mcp-la-gi-cho-ai-agent',
    'vi',
    'MCP là gì và vì sao AI agent cần một cổng kết nối chuẩn?',
    'Hiểu cách MCP giúp agent khám phá công cụ, nhận ngữ cảnh và gọi kỹ năng mà không phải tích hợp riêng từng nền tảng.',
    'MCP',
    'Ocean Labs',
    'hub',
    'from-primary-container/70 via-tertiary-container/30 to-background',
    7,
    'published',
    '2026-06-18 00:00:00+00',
    '[{"heading":"MCP giải quyết vấn đề gì?","paragraphs":["Một AI agent chỉ hữu ích khi nó có thể làm việc với dữ liệu và công cụ thật. Trước MCP, mỗi ứng dụng thường tự thiết kế cách truyền ngữ cảnh, mô tả công cụ và xác thực.","Model Context Protocol tạo một giao diện chung để client và server thống nhất cách công bố công cụ, tài nguyên và lời nhắc."]},{"heading":"OceanSkill dùng MCP như thế nào?","paragraphs":["Marketplace chỉ công khai metadata để người dùng đánh giá. Nội dung SKILL.md đầy đủ được giao qua MCP sau khi khóa API và quyền sử dụng được xác minh."],"bullets":["Tìm kỹ năng đang hoạt động.","Kiểm tra phiên bản và client tương thích.","Ghi nhận usage và trừ credit theo giao dịch thành công."]}]'::jsonb
  ),
  (
    'mcp-la-gi-cho-ai-agent',
    'en',
    'What is MCP, and why do AI agents need a standard connection layer?',
    'Learn how MCP lets agents discover tools, receive context, and invoke skills without a custom integration for every platform.',
    'MCP',
    'Ocean Labs',
    'hub',
    'from-primary-container/70 via-tertiary-container/30 to-background',
    7,
    'published',
    '2026-06-18 00:00:00+00',
    '[{"heading":"What problem does MCP solve?","paragraphs":["An AI agent becomes useful when it can work with real tools and data. Before MCP, every application tended to invent its own format for context, tool descriptions, and authentication.","Model Context Protocol gives clients and servers a shared way to expose tools, resources, and prompts."]},{"heading":"How OceanSkill uses MCP","paragraphs":["The marketplace exposes only enough metadata for evaluation. Full SKILL.md content is delivered through MCP after the API key and usage entitlement are verified."],"bullets":["Discover active skills.","Check versions and compatible clients.","Record usage and debit credits after successful execution."]}]'::jsonb
  )
on conflict (slug, locale) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  category = excluded.category,
  author_name = excluded.author_name,
  icon = excluded.icon,
  glow_class = excluded.glow_class,
  reading_minutes = excluded.reading_minutes,
  status = excluded.status,
  published_at = excluded.published_at,
  sections = excluded.sections;
