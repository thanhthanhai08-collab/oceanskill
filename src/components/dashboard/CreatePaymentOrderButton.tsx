"use client";

import type {ReactNode} from "react";
import {useRouter} from "next/navigation";
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
}: CreatePaymentOrderButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const startTopup = () => {
    setIsPending(true);
    router.push(`/${locale}/dashboard/billing/topup?pack=${encodeURIComponent(packId)}`);
  };

  return (
    <div>
      <button type="button" onClick={startTopup} disabled={isPending} className={className}>
        {isPending ? loadingLabel : children}
      </button>
    </div>
  );
}
