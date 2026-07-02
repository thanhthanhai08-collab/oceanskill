"use client";

import {useState, useTransition} from "react";
import type {ApiKey} from "@/lib/api-keys/manage";

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

interface ApiKeyManagerProps {
  readonly initialKeys: ApiKey[];
  readonly locale: string;
  readonly labels: Labels;
}

export default function ApiKeyManager({initialKeys, locale, labels}: ApiKeyManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));

  const handleCreate = () => {
    if (!keyName.trim()) return;
    setIsCreating(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/api-keys", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({name: keyName.trim()}),
        });
        const json = await res.json() as {key?: string; id?: string; name?: string; key_prefix?: string; created_at?: string};
        if (json.key && json.id) {
          setNewKeyValue(json.key);
          setKeys((prev) => [{
            id: json.id!, name: json.name!, key_prefix: json.key_prefix!,
            last_used_at: null, revoked_at: null, created_at: json.created_at!,
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
      await fetch(`/api/api-keys/${id}/revoke`, {method: "POST"});
      setKeys((prev) => prev.map((k) => k.id === id ? {...k, revoked_at: new Date().toISOString()} : k));
    });
  };

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* New key revealed */}
      {newKeyValue && (
        <div className="mb-6 rounded-2xl border border-tertiary/40 bg-tertiary/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-tertiary">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {labels.newKeyWarning}
          </p>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-container p-3">
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

      {/* Create form */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder={labels.keyNamePlaceholder}
          maxLength={64}
          className="flex-1 rounded-xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm outline-none ring-primary/30 transition focus:border-primary/50 focus:ring-2"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating || !keyName.trim()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">add</span>
          )}
          {isCreating ? labels.creating : labels.createKey}
        </button>
      </div>

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-sm text-on-surface-variant">
            {labels.emptyKeys}
          </p>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex flex-col gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-geist font-semibold">{key.name}</p>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${key.revoked_at ? "bg-error/10 text-error" : "bg-tertiary/10 text-tertiary"}`}>
                    {key.revoked_at ? labels.revoked : labels.active}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-on-surface-variant">{key.key_prefix}••••••••</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {labels.lastUsed}: {key.last_used_at ? formatDate(key.last_used_at) : labels.never}
                </p>
              </div>
              {!key.revoked_at && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(key.key_prefix, key.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-semibold transition hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[16px]">{copiedId === key.id ? "check" : "content_copy"}</span>
                    {copiedId === key.id ? labels.copied : labels.copyKey}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(key.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    {isPending ? labels.revoking : labels.revokeKey}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
