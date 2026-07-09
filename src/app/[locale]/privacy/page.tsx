import type {Metadata} from "next";
import SiteShell from "@/components/layout/SiteShell";

const content = {
  vi: {
    title: "Chính sách bảo mật",
    description: "Cách OceanSkill thu thập, sử dụng và bảo vệ dữ liệu tài khoản, thư viện skill, thanh toán và MCP key.",
    updated: "Cập nhật lần cuối: 09/07/2026",
    sections: [
      ["Dữ liệu chúng tôi xử lý", ["Thông tin tài khoản như email, tên hiển thị và ảnh đại diện.", "Dữ liệu sử dụng như skill đã bật, collection, MCP call, usage event và credit ledger.", "Thông tin thanh toán cần thiết để đối soát đơn nạp credit qua nhà cung cấp thanh toán.", "Nội dung người tạo nhập khi đăng skill riêng tư hoặc công khai."]],
      ["Cách chúng tôi sử dụng dữ liệu", ["Xác thực người dùng và bảo vệ dashboard.", "Kiểm tra quyền truy cập skill trước khi agent nhận nội dung qua MCP.", "Ghi nhận usage để tính credit, chống lạm dụng và hỗ trợ xử lý sự cố.", "Hiển thị metadata công khai như tên reviewer, avatar và review khi người dùng chủ động đánh giá skill."]],
      ["Bảo vệ key và dữ liệu nhạy cảm", ["MCP API key thô chỉ hiển thị một lần khi tạo; hệ thống lưu hash để xác thực các lần gọi sau.", "Service role key, webhook secret và secret thanh toán phải nằm trong biến môi trường server-side, không đưa vào client hoặc repository.", "Nội dung skill được bảo vệ bởi kiểm tra entitlement; browser client không nhận storage secret."]],
      ["Chia sẻ dữ liệu", ["Chúng tôi không bán dữ liệu cá nhân.", "Dữ liệu có thể được gửi tới nhà cung cấp hạ tầng, xác thực, database, thanh toán hoặc quan sát hệ thống khi cần vận hành dịch vụ.", "Thông tin công khai như author profile, skill metadata, review và avatar public có thể được hiển thị trên website."]],
      ["Quyền của bạn", ["Bạn có thể cập nhật tên hiển thị và avatar trong dashboard.", "Bạn có thể thu hồi MCP key bất cứ lúc nào.", "Bạn có thể liên hệ để yêu cầu kiểm tra, xuất hoặc xóa dữ liệu trong phạm vi pháp luật và nghĩa vụ vận hành cho phép."]],
    ],
  },
  en: {
    title: "Privacy policy",
    description: "How OceanSkill collects, uses, and protects account data, skill libraries, billing records, and MCP keys.",
    updated: "Last updated: July 9, 2026",
    sections: [
      ["Data we process", ["Account information such as email, display name, and avatar.", "Usage data such as enabled skills, collections, MCP calls, usage events, and credit ledger entries.", "Billing information needed to reconcile credit top-ups through payment providers.", "Creator-provided content when publishing private or public skills."]],
      ["How we use data", ["Authenticate users and protect the dashboard.", "Check skill access before an agent receives content through MCP.", "Record usage for credit accounting, abuse prevention, and troubleshooting.", "Display public metadata such as reviewer name, avatar, and review text when a user actively reviews a skill."]],
      ["Protecting keys and sensitive data", ["Raw MCP API keys are shown only once at creation; the system stores a hash for later authentication.", "Service role keys, webhook secrets, and payment secrets must stay in server-side environment variables, never in the client or repository.", "Skill content is protected by entitlement checks; browser clients do not receive storage secrets."]],
      ["Data sharing", ["We do not sell personal data.", "Data may be sent to infrastructure, authentication, database, payment, or observability providers when needed to operate the service.", "Public information such as author profiles, skill metadata, reviews, and public avatars may be shown on the website."]],
      ["Your choices", ["You can update your display name and avatar in the dashboard.", "You can revoke MCP keys at any time.", "You can contact us to request review, export, or deletion of your data where allowed by law and operational obligations."]],
    ],
  },
} as const;

function pick(locale: string) {
  return locale === "en" ? content.en : content.vi;
}

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const page = pick((await params).locale);
  return {title: page.title, description: page.description};
}

export default async function PrivacyPage({params}: {readonly params: Promise<{locale: string}>}) {
  const page = pick((await params).locale);
  return (
    <SiteShell>
      <main className="px-6 py-14 lg:py-20">
        <article className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{page.updated}</p>
          <h1 className="mt-4 font-geist text-4xl font-bold tracking-tight sm:text-6xl">{page.title}</h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">{page.description}</p>
          <div className="mt-12 space-y-10">
            {page.sections.map(([title, items]) => (
              <section key={title} className="border-t border-outline-variant/30 pt-8">
                <h2 className="font-geist text-2xl font-semibold">{title}</h2>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-on-surface-variant">
                  {items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
