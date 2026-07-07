import {NextResponse} from "next/server";
import {createMcpKey} from "@/lib/mcp/mcp-keys";
import {createClient} from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data} = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({error: "unauthorized"}, {status: 401});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error: "invalid_json"}, {status: 400}); }
  const name = typeof body === "object" && body !== null && "name" in body ? String(body.name) : "";
  try {
    const created = await createMcpKey(userId, name);
    return NextResponse.json({
      key: created.rawKey,
      id: created.apiKey.id,
      name: created.apiKey.name,
      key_prefix: created.apiKey.key_prefix,
      created_at: created.apiKey.created_at,
    }, {status: 201, headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({error: message === "Invalid API key name" ? "invalid_name" : "mcp_key_create_failed"}, {status: message === "Invalid API key name" ? 400 : 500});
  }
}
