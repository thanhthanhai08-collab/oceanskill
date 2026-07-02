import {getTranslations} from "next-intl/server";
import SiteShell from "@/components/layout/SiteShell";
import FaqExplorer, {type FaqItem} from "@/components/faq/FaqExplorer";
import OceanGuideChat from "@/components/chatbot/OceanGuideChat";

export default async function FaqPage() {
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
        <div className="mt-10"><FaqExplorer items={faq.raw("items") as FaqItem[]} categories={categoryIds.map((id) => ({id, label: faq(`categories.${id}`)}))} allLabel={faq("all")} searchLabel={faq("searchLabel")} searchPlaceholder={faq("searchPlaceholder")} noResults={faq("noResults")} relatedResource={faq("relatedResource")} resultCount={(count) => faq("resultCount", {count})} /></div>
      </div>
    </section>
    <section className="border-t border-outline-variant/25 bg-surface-container-lowest/35 px-6 py-16 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">OceanGuide</p><h2 className="mt-3 font-geist text-3xl font-bold sm:text-4xl">{faq("askTitle")}</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-on-surface-variant">{faq("askDescription")}</p></div>
        <OceanGuideChat welcome={chatbot("welcome")} placeholder={chatbot("placeholder")} send={chatbot("send")} clear={chatbot("clear")} disclaimer={chatbot("disclaimer")} fallback={chatbot("fallback")} suggestions={chatbot.raw("suggestions") as string[]} knowledge={chatbot.raw("knowledge") as Array<{keywords: string[]; answer: string; href: string; source: string}>}/>
      </div>
    </section>
  </SiteShell>;
}
