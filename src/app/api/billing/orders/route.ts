import {NextResponse} from "next/server";
import {createPaymentOrder} from "@/lib/billing/orders";
import {createClient} from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data} = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const packId = typeof body === "object" && body !== null && "packId" in body ? String(body.packId) : "";
  if (!UUID.test(packId)) return NextResponse.json({error: "invalid_pack_id"}, {status: 400});

  try {
    const order = await createPaymentOrder(userId, packId);
    return NextResponse.json({order}, {status: 201});
  } catch (error) {
    console.error("payment_order_create_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({error: "payment_order_create_failed"}, {status: 500});
  }
}
