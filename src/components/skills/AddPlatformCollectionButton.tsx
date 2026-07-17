"use client";

import {useState} from "react";

export default function AddPlatformCollectionButton({collectionId, collectionSlug, locale, initialAdded, labels}: {
  readonly collectionId: string;
  readonly collectionSlug: string;
  readonly locale: string;
  readonly initialAdded: boolean;
  readonly labels: {add: string; added: string; failed: string};
}) {
  const [added, setAdded] = useState(initialAdded);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const add = async () => {
    setPending(true);
    setError(false);
    const response = await fetch(`/api/dashboard/collections/${collectionId}/library`, {method: "POST"});
    setPending(false);
    if (response.status === 401) {
      window.location.assign(`/${locale}/login?next=/${locale}/skills/collections/${collectionSlug}`);
      return;
    }
    if (!response.ok) {
      setError(true);
      return;
    }
    setAdded(true);
  };

  return <div>
    <button type="button" disabled={added || pending} onClick={add} className="btn-payment w-full rounded-xl px-5 py-3 text-sm font-bold transition hover:brightness-105 disabled:cursor-default disabled:opacity-60">
      {added ? labels.added : pending ? "..." : labels.add}
    </button>
    {error && <p className="mt-2 text-sm text-error">{labels.failed}</p>}
  </div>;
}
