import {NextResponse} from "next/server";
import {createCreatorSlotOrder, createPaymentOrder} from "@/lib/billing/orders";
import {createClient} from "@/lib/supabase/server";
import {isPaymentConfigured} from "@/lib/sepay/qr";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data} = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const purpose = input.purpose === "creator_slots" ? "creator_slots" : "credits";
  const packId = String(input.packId ?? "");
  const amountVnd = Number(input.amountVnd ?? 0);
  if (purpose === "credits" && !UUID.test(packId)) return NextResponse.json({error: "invalid_pack_id"}, {status: 400});
  if (purpose === "creator_slots" && (!Number.isSafeInteger(amountVnd) || amountVnd < 5000 || amountVnd > 5_000_000 || amountVnd % 5000 !== 0)) {
    return NextResponse.json({error: "invalid_slot_amount"}, {status: 400});
  }
  if (!isPaymentConfigured()) {
    return NextResponse.json({
      error: "payment_not_configured",
      message: "Payment is not configured. Add the Supabase service role key and SePay bank details on the server."
    }, {status: 503});
  }

  try {
    const order = purpose === "creator_slots" ? await createCreatorSlotOrder(userId, amountVnd) : await createPaymentOrder(userId, packId);
    return NextResponse.json({order}, {status: 201});
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("payment_order_create_failed", message);
    return NextResponse.json({error: "payment_order_create_failed", message}, {status: 500});
  }
}
