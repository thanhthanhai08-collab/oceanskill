"use client";

import type {ReactNode} from "react";
import {useState} from "react";

export interface CreatePaymentOrderButtonProps {
  readonly packId: string;
  readonly locale: string;
  readonly children: ReactNode;
  readonly className: string;
  readonly loadingLabel: string;
  readonly errorLabel: string;
}

export default function CreatePaymentOrderButton({
  packId,
  locale,
  children,
  className,
  loadingLabel,
  errorLabel,
}: CreatePaymentOrderButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async () => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({packId}),
      });
      const payload = await response.json();
      const orderId = payload?.order?.id;

      if (!response.ok || typeof orderId !== "string") {
        throw new Error(payload?.error ?? "payment_order_create_failed");
      }

      window.location.assign(`/${locale}/dashboard/billing/invoices/${orderId}`);
    } catch {
      setError(errorLabel);
      setIsPending(false);
    }
  };

  return (
    <div>
      <button type="button" onClick={createOrder} disabled={isPending} className={className}>
        {isPending ? loadingLabel : children}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-error">{error}</p>}
    </div>
  );
}
