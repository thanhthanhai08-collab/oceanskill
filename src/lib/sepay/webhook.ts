import "server-only";
import {createHmac, timingSafeEqual} from "node:crypto";

const MAX_CLOCK_SKEW_SECONDS = 300;

export type SepayWebhookPayload = {
  id: number | string;
  gateway?: string;
  transactionDate: string;
  accountNumber: string;
  code?: string | null;
  content?: string;
  transferType: "in" | "out";
  transferAmount: number;
  referenceCode?: string | null;
};

export function verifySepayWebhook(input: {rawBody: string; signature: string | null; timestamp: string | null; secret: string; nowSeconds?: number}) {
  const {rawBody, signature, timestamp, secret} = input;
  if (!signature?.startsWith("sha256=") || !timestamp || !/^\d+$/.test(timestamp)) return false;
  const signedAt = Number(timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(signedAt) || Math.abs(now - signedAt) > MAX_CLOCK_SKEW_SECONDS) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function parseSepayTransactionDate(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? `${value.replace(" ", "T")}+07:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid SePay transaction date");
  return date.toISOString();
}

export function isSepayPayload(value: unknown): value is SepayWebhookPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (typeof payload.id === "number" || typeof payload.id === "string") &&
    typeof payload.transactionDate === "string" && typeof payload.accountNumber === "string" &&
    (payload.transferType === "in" || payload.transferType === "out") &&
    typeof payload.transferAmount === "number" && Number.isSafeInteger(payload.transferAmount) && payload.transferAmount > 0;
}
