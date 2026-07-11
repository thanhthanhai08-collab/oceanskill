import "server-only";
import {serverEnv} from "@/lib/env/server";

export function isPaymentConfigured() {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim() &&
    process.env.SEPAY_BANK_NAME?.trim()
  );
}

export function createSepayQrUrl(amountVnd: number, orderCode: string) {
  const params = new URLSearchParams({acc: serverEnv.sepayBankAccountNumber, bank: serverEnv.sepayBankName, amount: String(amountVnd), des: orderCode});
  return `https://qr.sepay.vn/img?${params.toString()}`;
}
