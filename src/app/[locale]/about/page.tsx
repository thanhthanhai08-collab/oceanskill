import type {Metadata} from "next";
import {Link} from "@/i18n/navigation";
import SiteShell from "@/components/layout/SiteShell";

const content = {
  vi: {
    title: "Giới thiệu OceanSkill",
    description: "OceanSkill là marketplace kỹ năng dành cho AI agent: tuyển chọn, kiểm tra, phân phối và đo lường cách agent sử dụng các skill trong môi trường làm việc thật.",
    eyebrow: "Về OceanSkill",
    missionTitle: "Chúng tôi xây dựng lớp kỹ năng đáng tin cậy cho agent",
    mission: "Agent chỉ hữu ích khi có thể dùng đúng công cụ, đúng ngữ cảnh và đúng quyền. OceanSkill tập trung vào việc biến các skill rời rạc thành một thư viện có kiểm soát: có metadata rõ ràng, nội dung được quét, quyền truy cập qua MCP key và usage được ghi nhận.",
    principlesTitle: "Nguyên tắc sản phẩm",
    principles: [
      ["Bảo mật trước", "Skill content, MCP key, credit ledger và dữ liệu người dùng được đặt sau các ranh giới quyền rõ ràng."],
      ["Dễ đánh giá", "Người dùng có thể xem metadata, tác giả, review và mức độ phù hợp trước khi bật skill cho agent."],
      ["Sẵn sàng vận hành", "Mỗi lần agent gọi skill đều đi qua xác thực, entitlement, usage tracking và kiểm soát credit."],
    ],
    workflowTitle: "OceanSkill hoạt động như thế nào",
    workflow: [
      "Người tạo hoặc nền tảng đăng skill kèm phiên bản và nội dung SKILL.md.",
      "OceanSkill kiểm tra nội dung, trạng thái phát hành và quyền sở hữu.",
      "Người dùng thêm skill hoặc collection vào thư viện của mình.",
      "AI agent gọi MCP endpoint bằng API key đã cấp để lấy danh sách hoặc nội dung skill được phép.",
    ],
    ctaTitle: "Khám phá marketplace",
    ctaDescription: "Bắt đầu với các skill đang hoạt động hoặc đọc tài liệu MCP để nối OceanSkill vào agent client của bạn.",
    marketplace: "Xem kho skill",
    docs: "Đọc tài liệu",
  },
  en: {
    title: "About OceanSkill",
    description: "OceanSkill is a skills marketplace for AI agents: curating, checking, delivering, and measuring how agents use skills in real working environments.",
    eyebrow: "About OceanSkill",
    missionTitle: "We build a trusted skill layer for agents",
    mission: "Agents are useful only when they can use the right tool, with the right context and the right permissions. OceanSkill turns loose skills into a governed library with clear metadata, scanned content, MCP-key access, and usage records.",
    principlesTitle: "Product principles",
    principles: [
      ["Security first", "Skill content, MCP keys, credit ledgers, and user data sit behind explicit permission boundaries."],
      ["Easy to evaluate", "Users can review metadata, authors, reviews, and fit before enabling a skill for an agent."],
      ["Ready for operations", "Every agent skill call passes through authentication, entitlement checks, usage tracking, and credit controls."],
    ],
    workflowTitle: "How OceanSkill works",
    workflow: [
      "Creators or the platform publish skills with versions and SKILL.md content.",
      "OceanSkill checks content, release status, and ownership.",
      "Users add skills or collections to their personal library.",
      "AI agents call the MCP endpoint with an issued API key to list or fetch permitted skill content.",
    ],
    ctaTitle: "Explore the marketplace",
    ctaDescription: "Start with active skills or read the MCP docs to connect OceanSkill to your agent client.",
    marketplace: "Browse skills",
    docs: "Read docs",
  },
} as const;

function pick(locale: string) {
  return locale === "en" ? content.en : content.vi;
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const page = pick((await params).locale);
  return {title: page.title, description: page.description};
}

export default async function AboutPage({params}: {readonly params: Promise<{locale: string}>}) {
  const page = pick((await params).locale);
  return (
    <SiteShell>
      <main>
        <section className="border-b border-outline-variant/25 px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{page.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-geist text-4xl font-bold tracking-tight sm:text-6xl">{page.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">{page.description}</p>
          </div>
        </section>
        <section className="px-6 py-14 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="font-geist text-3xl font-semibold">{page.missionTitle}</h2>
              <p className="mt-5 leading-8 text-on-surface-variant">{page.mission}</p>
            </div>
            <div className="grid gap-4">
              {page.principles.map(([title, description]) => (
                <article key={title} className="rounded-xl border border-outline-variant/35 bg-surface-container-low/55 p-5">
                  <h3 className="font-geist text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="border-y border-outline-variant/25 bg-surface-container-lowest/45 px-6 py-14 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-geist text-3xl font-semibold">{page.workflowTitle}</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {page.workflow.map((item, index) => (
                <article key={item} className="rounded-xl border border-outline-variant/35 bg-background/60 p-5">
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <p className="mt-4 text-sm leading-6 text-on-surface-variant">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="px-6 py-14 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-geist text-3xl font-semibold">{page.ctaTitle}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-on-surface-variant">{page.ctaDescription}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/skills" className="rounded-lg bg-primary-container px-5 py-3 text-sm font-semibold text-white">{page.marketplace}</Link>
              <Link href="/docs" className="rounded-lg border border-outline-variant/50 px-5 py-3 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary">{page.docs}</Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
