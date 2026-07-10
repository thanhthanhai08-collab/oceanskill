"use client";

import {useState} from "react";

type CopyButtonProps = Readonly<{text: string; label: string; copiedLabel: string}>;

export default function CopyButton({text, label, copiedLabel}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10" aria-label={copied ? copiedLabel : label}>
      <span className="material-symbols-outlined text-[17px]">{copied ? "check" : "content_copy"}</span>
      {copied ? copiedLabel : label}
    </button>
  );
}
