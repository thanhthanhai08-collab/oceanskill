import "server-only";
import {serverEnv} from "@/lib/env/server";

export function createSepayQrUrl(amountVnd: number, orderCode: string) {
  const params = new URLSearchParams({acc: serverEnv.sepayBankAccountNumber, bank: serverEnv.sepayBankName, amount: String(amountVnd), des: orderCode});
  return `https://qr.sepay.vn/img?${params.toString()}`;
}
