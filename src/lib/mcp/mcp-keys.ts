import "server-only";
import {createHash, randomBytes} from "node:crypto";

type McpKeyRpcClient = {
  rpc: (fn: "create_api_key_record", args: {
    p_user_id: string;
    p_name: string;
    p_key_prefix: string;
    p_key_hash: string;
  }) => PromiseLike<{data: {id: string; name: string; key_prefix: string; created_at: string} | null; error: {message: string} | null}>;
};

export async function createMcpKey(client: McpKeyRpcClient, userId: string, name: string) {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 80) throw new Error("Invalid API key name");
  const rawKey = `nsk_${randomBytes(32).toString("base64url")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);
  const {data, error} = await client.rpc("create_api_key_record", {
    p_user_id: userId, p_name: normalizedName, p_key_prefix: keyPrefix, p_key_hash: keyHash
  });
  if (error) throw new Error(`Could not create API key: ${error.message}`);
  if (!data) throw new Error("Could not create API key: empty response");
  return {apiKey: data, rawKey};
}
