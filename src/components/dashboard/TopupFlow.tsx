"use client";

import Image from "next/image";
import {useEffect, useMemo, useState} from "react";

export type TopupPack = Readonly<{
  id: string;
  code: string;
  name: string;
  price_vnd: number;
  credit_units: number;
}>;

type CreatedOrder = Readonly<{
  id: string;
  order_code: string;
  amount_vnd: number;
  credit_units: number;
  skill_slots?: number;
  qr_url: string;
  recipient: {
    accountNumber: string;
    accountHolderName?: string;
    bankName: string;
    bankFullName?: string;
  };
}>;

type TopupLabels = Readonly<{
  amountTitle: string;
  presetTitle: string;
  promoTitle: string;
  promoPlaceholder: string;
  promoApply: string;
  promoStatus: string;
  terms: string;
  termsLink: string;
  submit: string;
  submitting: string;
  summaryTitle: string;
  amount: string;
  discount: string;
  fee: string;
  free: string;
  total: string;
  receive: string;
  rate: string;
  choosePack: string;
  error: string;
  qrTitle: string;
  qrDescription: string;
  transferContent: string;
  waiting: string;
  close: string;
}>;

export interface TopupFlowProps {
  readonly packs: TopupPack[];
  readonly initialPackId?: string;
  readonly locale: string;
  readonly labels: TopupLabels;
  readonly purpose?: "credits" | "creator-slots";
  readonly initialAmount?: number;
}

function formatVnd(locale: string, value: number) {
  return `${value.toLocaleString(locale)} VND`;
}

export default function TopupFlow({packs, initialPackId, locale, labels, purpose = "credits", initialAmount}: TopupFlowProps) {
  const slotMode = purpose === "creator-slots";
  const [selectedId, setSelectedId] = useState(() => packs.some((pack) => pack.id === initialPackId) ? initialPackId! : packs[0]?.id ?? "");
  const [slotAmount, setSlotAmount] = useState(() => Number.isSafeInteger(initialAmount) && initialAmount! >= 5000 && initialAmount! % 5000 === 0 ? initialAmount! : 5000);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [promoApplied, setPromoApplied] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paymentResult, setPaymentResult] = useState<"success" | "failure" | null>(null);
  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedId) ?? packs[0], [packs, selectedId]);
  const discount = 0;
  const normalizedSlotAmount = Math.max(5000, Math.min(5000000, Math.ceil(slotAmount / 5000) * 5000));
  const total = slotMode ? normalizedSlotAmount : selectedPack ? Number(selectedPack.price_vnd) - discount : 0;
  const slotCount = normalizedSlotAmount / 5000;

  useEffect(() => {
    if (!order || paymentResult) return;
    let active = true;
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/billing/orders/${encodeURIComponent(order.order_code)}`, {cache: "no-store"});
        const payload = await response.json();
        const status = payload?.order?.status;
        if (!active) return;
        if (status === "paid") setPaymentResult("success");
        if (["failed", "expired", "refunded", "review"].includes(status)) setPaymentResult("failure");
      } catch {
        // Keep waiting: a transient network failure is not a failed payment.
      }
    };
    void checkStatus();
    const interval = window.setInterval(() => void checkStatus(), 3000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [order, paymentResult]);

  const createOrder = async () => {
    if ((!slotMode && !selectedPack) || !termsAccepted) return;
    setIsPending(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/orders", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(slotMode ? {purpose: "creator_slots", amountVnd: normalizedSlotAmount} : {packId: selectedPack!.id}),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.order?.qr_url) throw new Error(payload?.error ?? "payment_order_create_failed");
      setPaymentResult(null);
      setOrder(payload.order as CreatedOrder);
    } catch {
      setError(labels.error);
    } finally {
      setIsPending(false);
    }
  };

  if (!slotMode && !selectedPack) {
    return <p className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-sm text-on-surface-variant">{labels.choosePack}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-7">
          <section className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">01</span>
              <h2 className="font-geist text-2xl font-bold">{labels.amountTitle}</h2>
            </div>
            <div className="relative mb-6">
              <input
                readOnly={!slotMode}
                type={slotMode ? "number" : "text"}
                min={slotMode ? 5000 : undefined}
                max={slotMode ? 5000000 : undefined}
                step={slotMode ? 5000 : undefined}
                value={slotMode ? slotAmount : Number(selectedPack!.price_vnd).toLocaleString(locale)}
                onChange={slotMode ? (event) => setSlotAmount(Math.max(5000, Math.min(5000000, Number(event.target.value) || 5000))) : undefined}
                onBlur={slotMode ? () => setSlotAmount(normalizedSlotAmount) : undefined}
                className="w-full rounded-xl border border-outline-variant/30 bg-[#050608] p-6 pr-24 font-geist text-3xl font-bold text-primary outline-none transition focus:border-primary"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-geist text-xl text-on-surface-variant">VND</span>
            </div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.presetTitle}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(slotMode ? [5000, 10000, 25000, 50000].map((amount) => ({id: String(amount), name: `${amount / 5000} slot`, price_vnd: amount, credit_units: 0})) : packs).map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => slotMode ? setSlotAmount(Number(pack.price_vnd)) : setSelectedId(pack.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    (slotMode ? slotAmount === Number(pack.price_vnd) : selectedId === pack.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant/20 bg-surface-container-high text-on-surface hover:border-primary"
                  }`}
                >
                  <span className="block font-bold">{formatVnd(locale, Number(pack.price_vnd))}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{slotMode ? `${Number(pack.price_vnd) / 5000} ${Number(pack.price_vnd) === 5000 ? "slot" : "slots"}` : `${Number(pack.credit_units).toLocaleString(locale)} Credits`}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface-container-low/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">02</span>
              <h2 className="font-geist text-2xl font-bold">{labels.promoTitle}</h2>
            </div>
            <div className="flex gap-4">
              <input className="min-w-0 flex-1 rounded-xl border border-outline-variant/30 bg-[#050608] p-4 text-on-surface outline-none transition focus:border-tertiary" placeholder={labels.promoPlaceholder} />
              <button type="button" onClick={() => setPromoApplied(true)} className="rounded-xl border border-tertiary bg-tertiary/10 px-6 font-bold text-tertiary transition hover:bg-tertiary hover:text-on-tertiary">
                {labels.promoApply}
              </button>
            </div>
            {promoApplied && <p className="mt-3 text-sm font-semibold text-tertiary">{labels.promoStatus}</p>}
          </section>

          <label className="flex items-start gap-3 p-4 text-sm text-on-surface-variant">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-5 w-5 rounded border-outline-variant bg-surface-container text-primary" />
            <span>{labels.terms} <span className="text-primary underline">{labels.termsLink}</span>.</span>
          </label>

          <button
            type="button"
            onClick={createOrder}
            disabled={!termsAccepted || isPending}
            className="btn-payment flex w-full items-center justify-center gap-3 rounded-2xl p-6 text-xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{isPending ? labels.submitting : labels.submit}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          {error && <p className="text-sm font-semibold text-error">{error}</p>}
        </div>

        <aside className="xl:sticky xl:top-24 xl:col-span-5">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/70 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)] sm:p-8">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <h2 className="font-geist text-2xl font-bold">{labels.summaryTitle}</h2>
            <div className="mb-8 mt-8 space-y-4 border-b border-outline-variant/20 pb-8">
              <div className="flex items-center justify-between text-on-surface-variant"><span>{labels.amount}</span><span className="font-semibold text-on-surface">{formatVnd(locale, total)}</span></div>
              <div className="flex items-center justify-between text-on-surface-variant"><span>{labels.discount}</span><span className="font-semibold text-tertiary">{formatVnd(locale, discount)}</span></div>
              <div className="flex items-center justify-between text-on-surface-variant"><span>{labels.fee}</span><span className="font-semibold text-on-surface">{labels.free}</span></div>
            </div>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-sm text-on-surface-variant">{labels.total}</p>
                <p className="font-geist text-5xl font-bold text-primary">{total.toLocaleString(locale)}</p>
              </div>
              <p className="mb-2 font-geist text-2xl font-bold">VND</p>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-surface-container p-4">
              <span className="material-symbols-outlined text-secondary">info</span>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                {labels.receive} <strong>{slotMode ? `${slotCount} ${slotCount === 1 ? "slot" : "slots"}` : `${Number(selectedPack!.credit_units).toLocaleString(locale)} Credits`}</strong>. {slotMode ? (locale === "vi" ? "Slot được cộng sau khi thanh toán thành công." : "Slots are added after successful payment.") : labels.rate}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {order && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-6 backdrop-blur-md">
          <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-surface-container-low p-5 shadow-[0_0_48px_rgba(184,195,255,0.25)] sm:p-6">
            <button type="button" aria-label={labels.close} onClick={() => { setOrder(null); setPaymentResult(null); }} className="absolute right-6 top-6 text-on-surface-variant transition hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mb-4 text-center">
              <h3 className="font-geist text-2xl font-bold text-primary">{labels.qrTitle}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{labels.qrDescription}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
            <div className="flex h-[min(52vh,380px)] flex-col items-center justify-center rounded-2xl bg-white p-4">
              <Image src={order.qr_url} alt="VietQR payment code" width={512} height={512} unoptimized className="min-h-0 w-full flex-1 object-contain" />
              <div className="mt-4 flex items-center gap-2 text-[#0A0C12]">
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest">VietQR System</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-high p-4">
                <span className="text-xs text-on-surface-variant">{labels.transferContent}</span>
                <span className="font-mono text-sm font-bold text-primary">{order.order_code}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-high p-4">
                <span className="text-xs text-on-surface-variant">{labels.total}</span>
                <span className="font-mono text-sm font-bold">{formatVnd(locale, Number(order.amount_vnd))}</span>
              </div>
              <div className="space-y-2 rounded-xl bg-surface-container-high p-4 text-sm">
                <p><span className="text-on-surface-variant">{locale === "vi" ? "Ngân hàng" : "Bank"}: </span><span className="font-semibold">{order.recipient.bankFullName ?? order.recipient.bankName}</span></p>
                <p><span className="text-on-surface-variant">{locale === "vi" ? "Chủ tài khoản" : "Account holder"}: </span><span className="font-semibold">{order.recipient.accountHolderName ?? "—"}</span></p>
                <p><span className="text-on-surface-variant">{locale === "vi" ? "Số tài khoản" : "Account number"}: </span><span className="font-mono font-bold">{order.recipient.accountNumber}</span></p>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-tertiary">{labels.waiting}</p>
            </div>
          </section>
        </div>
      )}
      {paymentResult && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-6 backdrop-blur-md" role="alert">
          <section className={`w-full max-w-sm rounded-3xl border p-8 text-center shadow-2xl ${paymentResult === "success" ? "border-tertiary/40 bg-tertiary-container/20" : "border-error/40 bg-error/10"}`}>
            <span className={`material-symbols-outlined text-6xl ${paymentResult === "success" ? "text-tertiary" : "text-error"}`}>{paymentResult === "success" ? "check_circle" : "cancel"}</span>
            <h3 className="mt-4 font-geist text-2xl font-bold">{paymentResult === "success" ? (locale === "vi" ? "Thanh toán thành công" : "Payment successful") : (locale === "vi" ? "Thanh toán thất bại" : "Payment failed")}</h3>
            <p className="mt-2 text-sm text-on-surface-variant">{paymentResult === "success" ? (slotMode ? (locale === "vi" ? "Slot skill đã được cộng vào tài khoản của bạn" : "Skill slots have been added to your account") : (locale === "vi" ? "Credit đã được cộng vào tài khoản của bạn" : "Credits have been added to your account")) : (locale === "vi" ? "Giao dịch chưa được xác nhận. Vui lòng kiểm tra lại" : "The transaction was not confirmed. Please try again")}</p>
          <button type="button" onClick={() => { setPaymentResult(null); setOrder(null); }} className="btn-payment mt-6 rounded-xl px-6 py-3 font-bold hover:brightness-105">{labels.close}</button>
          </section>
        </div>
      )}
    </>
  );
}
