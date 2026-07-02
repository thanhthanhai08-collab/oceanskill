import {NextResponse} from "next/server";
import {applySepayPayment} from "@/lib/billing/orders";
import {serverEnv} from "@/lib/env/server";
import {isSepayPayload, parseSepayTransactionDate, verifySepayWebhook} from "@/lib/sepay/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifySepayWebhook({
    rawBody,
    signature: request.headers.get("x-sepay-signature"),
    timestamp: request.headers.get("x-sepay-timestamp"),
    secret: serverEnv.sepayWebhookSecret
  })) return NextResponse.json({success: false, message: "unauthorized"}, {status: 401});

  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({success: false, message: "invalid_json"}, {status: 400}); }
  if (!isSepayPayload(payload)) return NextResponse.json({success: false, message: "invalid_payload"}, {status: 400});
  if (payload.transferType !== "in") return NextResponse.json({success: true, result: "ignored_outbound"});
  if (payload.accountNumber !== serverEnv.sepayBankAccountNumber) return NextResponse.json({success: false, message: "account_mismatch"}, {status: 400});
  if (!payload.code || !/^NSK[A-F0-9]{18}$/.test(payload.code)) return NextResponse.json({success: true, result: "unmatched_code"});

  try {
    const result = await applySepayPayment({
      orderCode: payload.code,
      providerTransactionId: String(payload.id),
      referenceCode: payload.referenceCode ? String(payload.referenceCode) : null,
      amountVnd: payload.transferAmount,
      transactionAt: parseSepayTransactionDate(payload.transactionDate),
      metadata: {gateway: payload.gateway ?? null, content: payload.content?.slice(0, 500) ?? null, accountNumber: payload.accountNumber}
    });
    return NextResponse.json({success: true, result});
  } catch (error) {
    console.error("sepay_webhook_processing_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({success: false, message: "processing_failed"}, {status: 500});
  }
}
