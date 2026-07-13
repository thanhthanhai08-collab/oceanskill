import "server-only";
import {serverEnv} from "@/lib/env/server";
import {createVietQrDataUrl as renderVietQrDataUrl} from "@/lib/sepay/vietqr";

export type SepayRecipient = {
  accountNumber: string;
  accountHolderName?: string;
  bankName: string;
  bankFullName?: string;
};

export function isPaymentConfigured() {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim() &&
    process.env.SEPAY_BANK_NAME?.trim()
  );
}

export function getSepayRecipient(): SepayRecipient {
  return {
    accountNumber: serverEnv.sepayBankAccountNumber,
    accountHolderName: "DOAN VU NAM",
    bankName: serverEnv.sepayBankName,
    bankFullName: "Ngân hàng TMCP Công thương Việt Nam (VietinBank)",
  };
}

export async function createVietQrDataUrl(amountVnd: number, orderCode: string, recipient: SepayRecipient) {
  return renderVietQrDataUrl(amountVnd, orderCode, recipient.accountNumber);
}
