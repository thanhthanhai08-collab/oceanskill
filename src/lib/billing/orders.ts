import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {createSepayQrUrl} from "@/lib/sepay/qr";

type PaymentOrder = {id: string; order_code: string; amount_vnd: number; credit_units: number; status: string; expires_at: string};

export async function createPaymentOrder(userId: string, packId: string) {
  const {data, error} = await createAdminClient().rpc("create_sepay_payment_order", {p_user_id: userId, p_pack_id: packId});
  if (error) throw new Error(`Could not create payment order: ${error.message}`);
  const order = data as PaymentOrder | null;
  if (!order) throw new Error("Supabase returned no payment order");
  return {...order, qr_url: createSepayQrUrl(order.amount_vnd, order.order_code)};
}

export async function applySepayPayment(input: {orderCode: string; providerTransactionId: string; referenceCode: string | null; amountVnd: number; transactionAt: string; metadata: Record<string, string | null>}) {
  const {data, error} = await createAdminClient().rpc("apply_sepay_payment", {
    p_order_code: input.orderCode, p_provider_transaction_id: input.providerTransactionId,
    p_reference_code: input.referenceCode, p_amount_vnd: input.amountVnd,
    p_transaction_at: input.transactionAt, p_metadata: input.metadata
  });
  if (error) throw new Error(`Could not apply SePay payment: ${error.message}`);
  return String(data);
}
