import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

const ORDER_CODE = /^(?:NSK|SEVQR)[A-F0-9]{18}$/;

export async function GET(_request: Request, {params}: {params: Promise<{code: string}>}) {
  const {code} = await params;
  if (!ORDER_CODE.test(code)) return NextResponse.json({error: "invalid_order_code"}, {status: 400});
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const {data, error} = await supabase
    .from("payment_orders")
    .select("order_code,status,amount_vnd,credit_units,expires_at,paid_at")
    .eq("order_code", code)
    .maybeSingle();
  if (error) return NextResponse.json({error: "order_status_failed"}, {status: 500});
  if (!data) return NextResponse.json({error: "not_found"}, {status: 404});
  return NextResponse.json({order: data}, {headers: {"Cache-Control": "no-store"}});
}
