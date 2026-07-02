import "server-only";
import {createHash, randomBytes} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";

export async function createApiKey(userId: string, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 80) throw new Error("Invalid API key name");
  const rawKey = `nsk_${randomBytes(32).toString("base64url")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);
  const {data, error} = await createAdminClient().rpc("create_api_key_record", {
    p_user_id: userId, p_name: normalizedName, p_key_prefix: keyPrefix, p_key_hash: keyHash
  });
  if (error) throw new Error(`Could not create API key: ${error.message}`);
  return {apiKey: data, rawKey};
}
