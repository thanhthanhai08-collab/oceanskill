"use client";

import {useState, useTransition} from "react";
import type {McpKey} from "@/lib/mcp-keys/manage";

interface Labels {
  title: string;
  description: string;
  createKey: string;
  keyName: string;
  keyNamePlaceholder: string;
  creating: string;
  active: string;
  revoked: string;
  lastUsed: string;
  never: string;
  revokeKey: string;
  revoking: string;
  copyKey: string;
  copied: string;
  emptyKeys: string;
  newKeyWarning: string;
}

interface McpKeyManagerProps {
  readonly initialKeys: McpKey[];
  readonly locale: string;
  readonly labels: Labels;
}

export default function McpKeyManager({initialKeys, locale, labels}: McpKeyManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(value));

  const handleCreate = () => {
    if (!keyName.trim()) return;
    setIsCreating(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/mcp/mcp-keys", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({name: keyName.trim()}),
        });
        const json = await res.json() as {key?: string; id?: string; name?: string; key_prefix?: string; created_at?: string};
        if (json.key && json.id) {
          setNewKeyValue(json.key);
          setKeys((prev) => [{
            id: json.id,
            name: json.name ?? keyName.trim(),
            key_prefix: json.key_prefix ?? json.key.slice(0, 12),
            last_used_at: null,
            revoked_at: null,
            created_at: json.created_at ?? new Date().toISOString(),
          }, ...prev]);
          setKeyName("");
        }
      } finally {
        setIsCreating(false);
      }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/mcp/mcp-keys/${id}/revoke`, {method: "POST"});
      setKeys((prev) => prev.map((k) => k.id === id ? {...k, revoked_at: new Date().toISOString()} : k));
    });
  };

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="space-y-8">
      {newKeyValue && (
        <div className="rounded-xl border border-tertiary/40 bg-tertiary/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-tertiary">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {labels.newKeyWarning}
          </p>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-container-lowest p-3">
            <code className="flex-1 break-all font-mono text-xs">{newKeyValue}</code>
            <button
              type="button"
              onClick={() => handleCopy(newKeyValue, "new")}
              className="shrink-0 rounded-lg bg-tertiary/15 px-3 py-2 text-xs font-semibold text-tertiary transition hover:bg-tertiary/25"
            >
              {copiedId === "new" ? labels.copied : labels.copyKey}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">label</span>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={labels.keyNamePlaceholder}
            maxLength={64}
            className="w-full rounded-xl border border-white/5 bg-black/55 py-4 pl-12 pr-4 text-sm font-semibold outline-none ring-primary/30 transition placeholder:text-on-surface-variant focus:border-primary/50 focus:ring-2"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !keyName.trim()}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-secondary to-tertiary px-7 py-4 text-sm font-bold text-on-primary shadow-[0_0_24px_rgba(184,195,255,0.2)] transition hover:scale-[1.01] disabled:scale-100 disabled:opacity-50"
        >
          {isCreating ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">add</span>
          )}
          {isCreating ? labels.creating : labels.createKey}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-surface-container-low/30">
        {keys.length === 0 ? (
          <p className="p-8 text-center text-sm text-on-surface-variant">{labels.emptyKeys}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead className="bg-surface-container-high/50">
                <tr className="border-b border-white/5">
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{labels.keyName}</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Tracking ID</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Secret Key</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Created</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{labels.lastUsed}</th>
                  <th className="p-4 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Scope</th>
                  <th className="p-4 text-right font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((key) => (
                  <tr key={key.id} className="group transition hover:bg-white/[0.03]">
                    <td className="p-4 font-geist text-base font-bold">{key.name}</td>
                    <td className="p-4">
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${key.revoked_at ? "border-error/20 bg-error/10 text-error" : "border-primary/20 bg-primary/10 text-primary"}`}>
                        {key.revoked_at ? labels.revoked : labels.active}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-on-surface-variant">{key.key_prefix}...</td>
                    <td className="p-4 font-mono text-xs text-on-surface-variant">sk-...{key.key_prefix.slice(-4)}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{formatDate(key.created_at)}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{key.last_used_at ? formatDate(key.last_used_at) : labels.never}</td>
                    <td className="p-4 text-sm text-on-surface-variant">All</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-3 text-on-surface-variant opacity-70 transition group-hover:opacity-100">
                        <button type="button" onClick={() => handleCopy(key.key_prefix, key.id)} className="transition hover:text-primary" aria-label={labels.copyKey}>
                          <span className="material-symbols-outlined text-[20px]">{copiedId === key.id ? "check" : "content_copy"}</span>
                        </button>
                        {!key.revoked_at && (
                          <button type="button" onClick={() => handleRevoke(key.id)} disabled={isPending} className="transition hover:text-error disabled:opacity-50" aria-label={labels.revokeKey}>
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
