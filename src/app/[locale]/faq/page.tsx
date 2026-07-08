import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import FaqExplorer, {type FaqItem} from "@/components/faq/FaqExplorer";
import OceanGuideChat from "@/components/chatbot/OceanGuideChat";

const chatbotUi = {
  vi: {
    eyebrow: "Kết nối chatbot",
    title: "Hỏi OceanGuide ngay trong trung tâm trợ giúp",
    description: "Giao diện tạm thời cho luồng kết nối chatbot. Hiện tại chatbot trả lời từ bộ kiến thức frontend để bạn kiểm tra bố cục trước khi nối API.",
    status: "Frontend preview",
    sources: "Nguồn đang kết nối",
    sourceItems: ["FAQ đã dịch", "Tài liệu MCP", "Hướng dẫn thanh toán", "Kho skill"],
    flow: "Luồng xử lý",
    flowItems: ["Người dùng nhập câu hỏi", "Khớp từ khóa với knowledge base", "Trả lời kèm nguồn tham khảo"],
  },
  en: {
    eyebrow: "Chatbot connection",
    title: "Ask OceanGuide inside the help center",
    description: "Temporary frontend for the chatbot connection flow. It answers from local frontend knowledge so the layout can be reviewed before wiring the API.",
    status: "Frontend preview",
    sources: "Connected sources",
    sourceItems: ["Translated FAQ", "MCP docs", "Billing guide", "Skill library"],
    flow: "Flow",
    flowItems: ["User asks a question", "Match keywords against knowledge base", "Answer with a related source"],
  },
} as const;

export default async function FaqPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const code = locale === "vi" ? "vi" : "en";
  const [faq, chatbot] = await Promise.all([getTranslations("FAQ"), getTranslations("Chatbot")]);
  const categoryIds = ["getting-started", "mcp", "skills", "billing", "security"] as const;
  return <SiteShell>
    <section className="relative overflow-hidden px-6 py-14 lg:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_16%,rgba(46,91,255,.2),transparent_28%),radial-gradient(circle_at_82%_38%,rgba(0,220,229,.12),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{faq("eyebrow")}</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-geist text-4xl font-bold tracking-tight sm:text-6xl">{faq("title")}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-on-surface-variant">{faq("description")}</p>
        </header>
        <div className="mt-10"><FaqExplorer items={faq.raw("items") as FaqItem[]} categories={categoryIds.map((id) => ({id, label: faq(`categories.${id}`)}))} allLabel={faq("all")} searchLabel={faq("searchLabel")} searchPlaceholder={faq("searchPlaceholder")} noResults={faq("noResults")} relatedResource={faq("relatedResource")} resultCountLabels={{zero: faq("resultCount", {count: 0}), one: faq("resultCount", {count: 1}), many: code === "vi" ? "{count} câu trả lời" : "{count} answers"}} /></div>
      </div>
    </section>
    <section className="border-t border-outline-variant/25 bg-surface-container-lowest/35 px-6 py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">OceanGuide</p>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">{chatbotUi[code].status}</span>
          </div>
          <h2 className="mt-4 font-geist text-3xl font-bold">{chatbotUi[code].title}</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{chatbotUi[code].description}</p>

          <div className="mt-7 space-y-5">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{chatbotUi[code].sources}</p>
              <div className="grid gap-2">
                {chatbotUi[code].sourceItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="material-symbols-outlined text-[17px] text-tertiary">database</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{chatbotUi[code].flow}</p>
              <div className="space-y-3">
                {chatbotUi[code].flowItems.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[11px] font-bold text-primary">{index + 1}</span>
                    <p className="pt-1 text-sm text-on-surface-variant">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{chatbotUi[code].eyebrow}</p>
            <h2 className="mt-3 font-geist text-3xl font-bold sm:text-4xl">{faq("askTitle")}</h2>
            <p className="mt-3 max-w-2xl leading-7 text-on-surface-variant">{faq("askDescription")}</p>
          </div>
          <OceanGuideChat welcome={chatbot("welcome")} placeholder={chatbot("placeholder")} send={chatbot("send")} clear={chatbot("clear")} disclaimer={chatbot("disclaimer")} fallback={chatbot("fallback")} suggestions={chatbot.raw("suggestions") as string[]} knowledge={chatbot.raw("knowledge") as Array<{keywords: string[]; answer: string; href: string; source: string}>}/>
        </div>
      </div>
    </section>
  </SiteShell>;
}
