import type {Locale} from "@/i18n/locales";

type LocalizedText = Readonly<Record<Locale, string>>;

export type BlogSection = Readonly<{
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}>;

type BlogSource = Readonly<{
  slug: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  author: string;
  icon: string;
  glowClass: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  sections: Readonly<Record<Locale, BlogSection[]>>;
}>;

export type BlogPost = Readonly<Omit<BlogSource, "title" | "excerpt" | "sections"> & {
  title: string;
  excerpt: string;
  sections: BlogSection[];
  contentMarkdown?: string;
}>;

const blogSources: BlogSource[] = [
  {
    slug: "mcp-la-gi-cho-ai-agent",
    category: "MCP",
    publishedAt: "2026-06-18",
    updatedAt: "2026-07-02",
    readingMinutes: 7,
    author: "Ocean Labs",
    icon: "hub",
    glowClass: "from-primary-container/70 via-tertiary-container/30 to-background",
    title: {vi: "MCP là gì và vì sao AI agent cần một cổng kết nối chuẩn?", en: "What is MCP, and why do AI agents need a standard connection layer?"},
    excerpt: {vi: "Hiểu cách MCP giúp agent khám phá công cụ, nhận ngữ cảnh và gọi kỹ năng mà không phải tích hợp riêng từng nền tảng.", en: "Learn how MCP lets agents discover tools, receive context, and invoke skills without a custom integration for every platform."},
    sections: {
      vi: [
        {heading: "MCP giải quyết vấn đề gì?", paragraphs: ["Một AI agent chỉ hữu ích khi nó có thể làm việc với dữ liệu và công cụ thật. Trước MCP, mỗi ứng dụng thường tự thiết kế cách truyền ngữ cảnh, mô tả công cụ và xác thực. Điều đó tạo ra nhiều tích hợp khó bảo trì.", "Model Context Protocol tạo một giao diện chung để client và server thống nhất cách công bố công cụ, tài nguyên và lời nhắc. Agent không cần biết hệ thống phía sau dùng Supabase, API nội bộ hay tệp cục bộ."]},
        {heading: "OceanSkill dùng MCP như thế nào?", paragraphs: ["Trang marketplace chỉ công khai metadata để người dùng đánh giá. Nội dung SKILL.md đầy đủ được giao qua MCP sau khi khóa API và quyền sử dụng được xác minh."], bullets: ["Tìm kỹ năng đang hoạt động.", "Kiểm tra phiên bản và client tương thích.", "Gọi nội dung được bảo vệ khi quy trình cần đến.", "Ghi nhận usage và trừ credit theo giao dịch thành công."]},
        {heading: "Bắt đầu từ đâu?", paragraphs: ["Hãy chọn một kỹ năng nhỏ, kết nối MCP vào một client và chạy một nhiệm vụ có kết quả dễ kiểm tra. Sau đó mới mở rộng sang chuỗi công việc nhiều agent."], bullets: ["Đọc trang Docs để lấy cấu hình mẫu.", "Tạo khóa API riêng cho từng client.", "Thu hồi khóa không còn sử dụng."]}
      ],
      en: [
        {heading: "What problem does MCP solve?", paragraphs: ["An AI agent becomes useful when it can work with real tools and data. Before MCP, every application tended to invent its own format for context, tool descriptions, and authentication. Those integrations were expensive to maintain.", "Model Context Protocol gives clients and servers a shared way to expose tools, resources, and prompts. The agent does not need to know whether the service behind them uses Supabase, an internal API, or local files."]},
        {heading: "How OceanSkill uses MCP", paragraphs: ["The marketplace exposes only enough metadata for evaluation. Full SKILL.md content is delivered through MCP after the API key and usage entitlement are verified."], bullets: ["Discover active skills.", "Check versions and compatible clients.", "Request protected content only when needed.", "Record usage and debit credits after successful execution."]},
        {heading: "Where to start", paragraphs: ["Choose one small skill, connect MCP to one client, and run a task with an outcome you can verify. Expand to multi-agent workflows only after that loop works."], bullets: ["Use the Docs page for a configuration example.", "Create a separate API key for each client.", "Revoke keys you no longer use."]}
      ]
    }
  },
  {
    slug: "bao-mat-agent-skill-voi-supabase-rls",
    category: "Security",
    publishedAt: "2026-06-22",
    updatedAt: "2026-07-02",
    readingMinutes: 8,
    author: "AgentOps Guild",
    icon: "shield_lock",
    glowClass: "from-secondary-container/70 via-primary-container/35 to-background",
    title: {vi: "Bảo vệ agent skill bằng Supabase Auth và Row Level Security", en: "Protecting agent skills with Supabase Auth and Row Level Security"},
    excerpt: {vi: "Tách metadata công khai khỏi nội dung được bảo vệ, xác minh JWT ở server và giới hạn dữ liệu theo đúng người sở hữu.", en: "Separate public metadata from protected content, validate JWTs on the server, and constrain user data to its owner."},
    sections: {
      vi: [
        {heading: "Hai lớp kiểm soát khác nhau", paragraphs: ["Xác thực trả lời câu hỏi người dùng là ai. Phân quyền trả lời người dùng đó được phép đọc hoặc thay đổi dòng dữ liệu nào. Một session hợp lệ không tự động đồng nghĩa với quyền truy cập mọi dữ liệu."], bullets: ["Supabase Auth xác minh danh tính.", "RLS thêm điều kiện sở hữu vào từng truy vấn.", "GRANT quyết định bảng có được Data API công bố hay không."]},
        {heading: "Ranh giới public và private", paragraphs: ["Bảng skills có thể công khai các bản ghi active. API key, ledger, payment order và usage event phải chỉ hiển thị cho auth.uid() tương ứng. Bí mật khóa không nên nằm trong schema công khai."], bullets: ["Không đưa service role key vào client.", "Không dùng user_metadata để quyết định quyền.", "View công khai cần security_invoker khi phù hợp."]},
        {heading: "Kiểm tra trước production", paragraphs: ["Hãy thử truy vấn bằng anon, bằng hai tài khoản khác nhau và bằng khóa đã thu hồi. Một chính sách tốt phải từ chối đúng dữ liệu, không chỉ cho phép happy path."]}
      ],
      en: [
        {heading: "Two different control layers", paragraphs: ["Authentication answers who the user is. Authorization answers which rows that user may read or change. A valid session does not automatically grant access to every record."], bullets: ["Supabase Auth validates identity.", "RLS adds ownership predicates to queries.", "GRANT controls whether a table is exposed through the Data API."]},
        {heading: "The public and private boundary", paragraphs: ["The skills table can expose active catalog records. API keys, ledgers, payment orders, and usage events must remain scoped to the matching auth.uid(). Key secrets should not live in an exposed schema."], bullets: ["Never ship the service role key to a client.", "Do not use user_metadata for authorization.", "Use security_invoker for exposed views when appropriate."]},
        {heading: "Test before production", paragraphs: ["Query as anon, as two different users, and with a revoked key. A good policy denies the wrong data, not merely allows the happy path."]}
      ]
    }
  },
  {
    slug: "chon-skill-cho-codex-claude-cursor",
    category: "Guide",
    publishedAt: "2026-06-27",
    updatedAt: "2026-07-01",
    readingMinutes: 6,
    author: "Ocean Labs",
    icon: "compare_arrows",
    glowClass: "from-tertiary-container/70 via-primary-container/35 to-background",
    title: {vi: "Cách chọn skill phù hợp cho Codex, Claude Code và Cursor", en: "How to choose skills for Codex, Claude Code, and Cursor"},
    excerpt: {vi: "Đánh giá skill theo đầu ra, mức quyền, khả năng kiểm chứng và độ tương thích thay vì chỉ nhìn mô tả hấp dẫn.", en: "Evaluate skills by outcome, permissions, verifiability, and compatibility rather than attractive descriptions alone."},
    sections: {
      vi: [
        {heading: "Bắt đầu từ đầu ra", paragraphs: ["Một skill tốt mô tả rõ nó tạo ra kết quả gì, bằng chứng nào cần thu thập và khi nào phải dừng để hỏi người dùng. Tên công cụ chỉ là điều kiện triển khai, không phải giá trị cốt lõi."]},
        {heading: "Bốn câu hỏi đánh giá", paragraphs: ["Dùng bốn câu hỏi này trước khi cấp skill cho agent."], bullets: ["Đầu ra có kiểm chứng được không?", "Skill cần quyền đọc hay ghi nào?", "Nó xử lý lỗi và trạng thái thiếu dữ liệu ra sao?", "Phiên bản đã được thử trên client bạn dùng chưa?"]},
        {heading: "Tạo bộ skill nhỏ", paragraphs: ["Bắt đầu với ba đến năm skill có ranh giới rõ. Một catalog nhỏ nhưng dễ dự đoán thường tạo kết quả tốt hơn một danh sách dài với trách nhiệm chồng chéo."]}
      ],
      en: [
        {heading: "Start with the outcome", paragraphs: ["A useful skill states the result it produces, the evidence it must collect, and when it should stop for user input. Tool names are implementation constraints, not the core value."]},
        {heading: "Four evaluation questions", paragraphs: ["Ask these before granting a skill to an agent."], bullets: ["Can you verify the output?", "Which read or write permissions does it need?", "How does it handle errors and missing data?", "Has the release been tested with your client?"]},
        {heading: "Build a small skill set", paragraphs: ["Start with three to five skills with clear boundaries. A small predictable catalog often performs better than a long list with overlapping responsibilities."]}
      ]
    }
  },
  {
    slug: "agent-workflow-cho-marketing-va-sales",
    category: "Growth",
    publishedAt: "2026-07-01",
    updatedAt: "2026-07-02",
    readingMinutes: 7,
    author: "Growth Systems",
    icon: "campaign",
    glowClass: "from-primary-container/65 via-secondary-container/40 to-background",
    title: {vi: "Thiết kế agent workflow cho marketing và bán hàng", en: "Designing agent workflows for marketing and sales"},
    excerpt: {vi: "Kết nối nghiên cứu, định vị, nội dung và follow-up thành một chuỗi có điểm kiểm duyệt rõ ràng.", en: "Connect research, positioning, content, and follow-up into a sequence with explicit review gates."},
    sections: {
      vi: [
        {heading: "Đừng bắt đầu bằng tự động hóa", paragraphs: ["Hãy bắt đầu bằng việc vẽ luồng quyết định: dữ liệu đầu vào, người phê duyệt, đầu ra và tiêu chí chất lượng. Tự động hóa một quy trình mơ hồ chỉ giúp tạo lỗi nhanh hơn."]},
        {heading: "Một chuỗi thực tế", paragraphs: ["Một workflow tăng trưởng có thể chia thành các skill nhỏ."], bullets: ["Nghiên cứu tài khoản và thị trường.", "Tổng hợp insight và giả thuyết thông điệp.", "Soạn nội dung theo kênh.", "Kiểm duyệt claim và dữ liệu nhạy cảm.", "Theo dõi phản hồi để cập nhật bước tiếp theo."]},
        {heading: "Giữ con người ở đúng điểm", paragraphs: ["Con người nên duyệt các claim thương hiệu, giá, cam kết và liên hệ ra bên ngoài. Agent phù hợp với thu thập, biến đổi và chuẩn bị phương án; quyền gửi cuối cùng cần được kiểm soát."]}
      ],
      en: [
        {heading: "Do not start with automation", paragraphs: ["Start by mapping the decision flow: inputs, approver, output, and quality criteria. Automating an unclear process only produces mistakes faster."]},
        {heading: "A practical sequence", paragraphs: ["A growth workflow can be split into small skills."], bullets: ["Research the account and market.", "Synthesize insights and messaging hypotheses.", "Draft channel-specific content.", "Review claims and sensitive data.", "Use responses to update the next action."]},
        {heading: "Keep people at the right gates", paragraphs: ["People should approve brand claims, pricing, commitments, and external outreach. Agents are strong at collection, transformation, and preparing options; the final send permission should remain controlled."]}
      ]
    }
  }
];

function localizePost(source: BlogSource, locale: Locale): BlogPost {
  return {...source, title: source.title[locale], excerpt: source.excerpt[locale], sections: source.sections[locale]};
}

export function getBlogPosts(locale: Locale) {
  return blogSources.map((post) => localizePost(post, locale)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string, locale: Locale) {
  const source = blogSources.find((post) => post.slug === slug);
  return source ? localizePost(source, locale) : null;
}

export function getRelatedPosts(post: BlogPost, locale: Locale, limit = 3) {
  return getBlogPosts(locale).filter((candidate) => candidate.slug !== post.slug).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, limit);
}

export function getBlogSlugs() {
  return blogSources.map((post) => post.slug);
}
