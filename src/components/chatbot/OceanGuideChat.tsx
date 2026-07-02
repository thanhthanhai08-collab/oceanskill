"use client";

import {useState, type FormEvent} from "react";
import {Link} from "@/i18n/navigation";

type KnowledgeEntry = Readonly<{keywords: string[]; answer: string; href: string; source: string}>;
type Message = Readonly<{id: number; role: "user" | "assistant"; content: string; href?: string; source?: string}>;

export interface OceanGuideChatProps {
  readonly welcome: string; readonly placeholder: string; readonly send: string; readonly clear: string; readonly disclaimer: string; readonly fallback: string; readonly suggestions: string[]; readonly knowledge: KnowledgeEntry[];
}

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(); }

export default function OceanGuideChat(props: OceanGuideChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{id: 0, role: "assistant", content: props.welcome}]);
  const answer = (question: string) => {
    const normalized = normalize(question);
    const entry = props.knowledge.map((item) => ({item, score: item.keywords.filter((keyword) => normalized.includes(normalize(keyword))).length})).sort((a, b) => b.score - a.score)[0];
    const response = entry?.score ? entry.item : null;
    setMessages((current) => [...current, {id: Date.now(), role: "user", content: question}, {id: Date.now() + 1, role: "assistant", content: response?.answer ?? props.fallback, href: response?.href, source: response?.source}]);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); const value = input.trim(); if (!value) return; answer(value); setInput(""); };
  return <div className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-low/55 shadow-2xl shadow-primary-container/10"><div className="flex min-h-[480px] max-h-[620px] flex-col gap-4 overflow-y-auto p-5 sm:p-7" aria-live="polite">{messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-primary-container text-white" : "border border-outline-variant/35 bg-surface-container text-on-surface"}`}><p>{message.content}</p>{message.href && <Link href={message.href} className="mt-3 inline-flex items-center gap-1 font-semibold text-primary">{message.source}<span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>}</div>)}</div><div className="border-t border-outline-variant/30 p-4 sm:p-5"><div className="mb-4 flex flex-wrap gap-2">{props.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => answer(suggestion)} className="rounded-full border border-outline-variant/45 px-3 py-2 text-xs text-on-surface-variant transition hover:border-primary/50 hover:text-primary">{suggestion}</button>)}</div><form onSubmit={submit} className="flex gap-2"><label className="sr-only" htmlFor="ocean-guide-question">{props.placeholder}</label><input id="ocean-guide-question" value={input} onChange={(event) => setInput(event.target.value)} placeholder={props.placeholder} className="min-w-0 flex-1 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary"/><button className="rounded-xl bg-primary-container px-5 py-3 font-semibold text-white hover:bg-inverse-primary">{props.send}</button></form><div className="mt-3 flex items-start justify-between gap-4"><p className="max-w-xl text-[11px] leading-5 text-on-surface-variant">{props.disclaimer}</p><button type="button" onClick={() => setMessages([{id: Date.now(), role: "assistant", content: props.welcome}])} className="shrink-0 font-mono text-[10px] text-on-surface-variant hover:text-primary">{props.clear}</button></div></div></div>;
}
