import type {Metadata} from "next";
import SiteShell from "@/components/layout/SiteShell";

const content = {
  vi: {
    title: "Điều khoản dịch vụ",
    description: "Các điều khoản áp dụng khi bạn sử dụng OceanSkill, marketplace skill, dashboard, MCP endpoint và credit.",
    updated: "Cập nhật lần cuối: 09/07/2026",
    sections: [
      ["Chấp nhận điều khoản", ["Khi tạo tài khoản, sử dụng dashboard hoặc gọi MCP endpoint, bạn đồng ý tuân thủ các điều khoản này.", "Nếu bạn sử dụng OceanSkill thay mặt tổ chức, bạn xác nhận mình có quyền ràng buộc tổ chức đó."]],
      ["Tài khoản và MCP key", ["Bạn chịu trách nhiệm bảo vệ tài khoản và MCP API key của mình.", "MCP key không được chia sẻ công khai, nhúng vào client public hoặc commit vào repository.", "OceanSkill có thể thu hồi hoặc giới hạn key khi phát hiện lạm dụng, truy cập trái phép hoặc rủi ro bảo mật."]],
      ["Sử dụng skill và nội dung", ["Skill metadata có thể được hiển thị công khai; nội dung skill đầy đủ chỉ được cung cấp khi bạn có quyền truy cập phù hợp.", "Bạn không được dùng skill để xâm nhập hệ thống, đánh cắp dữ liệu, phát tán mã độc, vi phạm quyền riêng tư hoặc vi phạm pháp luật.", "Người tạo skill chịu trách nhiệm về nội dung họ đăng và các quyền cần thiết để phân phối nội dung đó."]],
      ["Credit, thanh toán và usage", ["Credit được dùng để ghi nhận hoặc tính phí các lượt gọi MCP theo logic sản phẩm hiện hành.", "Giao dịch nạp credit có thể cần đối soát với nhà cung cấp thanh toán trước khi được ghi nhận hoàn tất.", "Chúng tôi có thể điều chỉnh ledger khi phát hiện lỗi kỹ thuật, giao dịch trùng lặp, gian lận hoặc hoàn tiền."]],
      ["Giới hạn trách nhiệm", ["OceanSkill được cung cấp theo hiện trạng trong phạm vi pháp luật cho phép.", "Chúng tôi nỗ lực kiểm tra nội dung và bảo vệ ranh giới quyền, nhưng bạn vẫn cần đánh giá skill trước khi dùng trong môi trường nhạy cảm.", "Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ việc cấu hình sai, lộ key hoặc sử dụng skill ngoài mục đích hợp lệ."]],
      ["Thay đổi điều khoản", ["Chúng tôi có thể cập nhật điều khoản khi sản phẩm, pháp luật hoặc yêu cầu vận hành thay đổi.", "Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận phiên bản mới."]],
    ],
  },
  en: {
    title: "Terms of service",
    description: "Terms that apply when you use OceanSkill, the skill marketplace, dashboard, MCP endpoint, and credits.",
    updated: "Last updated: July 9, 2026",
    sections: [
      ["Acceptance", ["By creating an account, using the dashboard, or calling the MCP endpoint, you agree to these terms.", "If you use OceanSkill on behalf of an organization, you confirm that you are authorized to bind that organization."]],
      ["Accounts and MCP keys", ["You are responsible for protecting your account and MCP API keys.", "MCP keys must not be shared publicly, embedded in public clients, or committed to repositories.", "OceanSkill may revoke or limit keys when abuse, unauthorized access, or security risk is detected."]],
      ["Skill and content use", ["Skill metadata may be shown publicly; full skill content is delivered only when you have appropriate access.", "You may not use skills to compromise systems, steal data, distribute malware, violate privacy, or break the law.", "Skill creators are responsible for the content they publish and the rights needed to distribute it."]],
      ["Credits, billing, and usage", ["Credits are used to record or charge MCP calls according to the current product logic.", "Credit top-ups may require reconciliation with a payment provider before being marked complete.", "We may adjust ledger entries when technical errors, duplicate transactions, fraud, or refunds are detected."]],
      ["Limitation of liability", ["OceanSkill is provided as-is to the extent permitted by law.", "We work to check content and protect permission boundaries, but you still need to evaluate skills before using them in sensitive environments.", "We are not responsible for indirect damages caused by misconfiguration, leaked keys, or use of skills outside valid purposes."]],
      ["Changes", ["We may update these terms as the product, law, or operational requirements change.", "Continuing to use the service after the terms are updated means you accept the new version."]],
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

export default async function TermsPage({params}: {readonly params: Promise<{locale: string}>}) {
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
