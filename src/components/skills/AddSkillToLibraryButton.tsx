"use client";

import {useState, useTransition} from "react";

type Toast = Readonly<{kind: "success" | "info" | "error"; message: string}>;

export default function AddSkillToLibraryButton({skillId, labels}: {
  readonly skillId: string;
  readonly labels: Readonly<{add: string; added: string; already: string; failed: string}>;
}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (next: Toast) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 2600);
  };

  const addSkill = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/user-skill-library/${skillId}`, {method: "POST"});
        const json = await response.json() as {status?: "added" | "already"; error?: string};
        if (!response.ok) {
          showToast({kind: "error", message: labels.failed});
          return;
        }
        showToast({
          kind: json.status === "already" ? "info" : "success",
          message: json.status === "already" ? labels.already : labels.added,
        });
      } catch {
        showToast({kind: "error", message: labels.failed});
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={addSkill}
        disabled={isPending}
      className="btn-payment flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold hover:brightness-110 disabled:opacity-70"
      >
        {isPending ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">add_circle</span>}
        {labels.add}
      </button>
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex min-h-12 max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur ${
          toast.kind === "error" ? "border-error/30 bg-error/15 text-error" : toast.kind === "info" ? "border-tertiary/30 bg-tertiary/15 text-tertiary" : "border-primary/30 bg-primary/15 text-primary"
        }`}>
          <span className="material-symbols-outlined text-[20px]">{toast.kind === "success" ? "check_circle" : toast.kind === "info" ? "info" : "error"}</span>
          {toast.message}
        </div>
      )}
    </>
  );
}
