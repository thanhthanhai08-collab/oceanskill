# OceanSkill MCP Edge Function

OceanSkill can serve MCP clients through a Supabase Edge Function:

```text
Claude Code / Cursor / Codex MCP client
  -> MCP JSON-RPC over HTTP, Authorization: Bearer nsk_...
Supabase Edge Function: /functions/v1/mcp
  -> validates API key, rate limits, dispatches tool calls
Supabase Postgres
  -> service_role client, RPC helpers, reserve/complete credit ledger
```

## Deploy

The Edge Function uses an OceanSkill MCP API key, not a Supabase Auth JWT, so deploy it with JWT verification disabled:

```bash
supabase functions deploy mcp --no-verify-jwt
```

Set secrets before deploy:

```bash
supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend code, public env vars, IDE config, or MCP client config.

## Endpoint

```text
https://<project-ref>.supabase.co/functions/v1/mcp
```

Every MCP request must include:

```http
Authorization: Bearer nsk_...
Content-Type: application/json
```

## Client Config Examples

Exact MCP config shapes vary by client release, but the important bits are URL and header.

Claude Code / Cursor style HTTP MCP config:

```json
{
  "mcpServers": {
    "oceanskill": {
      "type": "http",
      "url": "https://<project-ref>.supabase.co/functions/v1/mcp",
      "headers": {
        "Authorization": "Bearer nsk_your_key_here"
      }
    }
  }
}
```

If a client only supports command-based MCP servers, wrap the HTTP endpoint with that client's supported MCP HTTP bridge and pass the same URL/header there.

## Tools

- `list_purchased_skills`: returns public skills in the user's library plus private skills owned by the user.
- `search_skills`: searches skill metadata only. It does not expose protected skill content.
- `get_skill_md`: returns the scanned current `SKILL.md` and mapped reference keys for an allowed skill.
- `get_skill_reference`: returns one mapped Storage file for the skill's current version.
- `list_collections`: returns public collections and the caller's own collections.
- `add_collection_to_library`: adds a public or owned collection to the caller's collection library and enables all skills in that collection.
- `toggle_skill`: enables or disables a skill in the caller's skill library without fetching paid content.
- `get_usage_summary`: returns current credit balance, month-to-date usage, and enabled skill count.

## Credit Pattern

Every successful MCP `tools/call` writes one row to `mcp_call_events`, which is used for transparent MCP call counts. This counter is separate from credit charging.

Only `get_skill_md` and `get_skill_reference` are charged. The other tools are free setup/visibility tools.

Both paid tools use reserve-then-complete:

1. Resolve and authorize the API key.
2. Confirm the skill is public in the user's library, or private and owned by the user.
3. Call `reserve_mcp_usage_resource_versioned` to reserve one credit against the exact skill version and optional reference key.
4. Load the scanned Markdown or exact mapped Storage reference.
5. Call `finalize_mcp_usage` after successful response preparation.
6. Call `release_mcp_usage` if reading or response preparation fails.

## Security Notes

- The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY`, so it bypasses RLS. Keep every authorization check in the function and RPC helpers.
- MCP IDE clients are not browser clients, so browser CORS is not the main constraint.
- Rate limiting currently uses an in-memory 60 requests/minute window per API key instance. For distributed hard limits, move the counter into Postgres or Redis.
- API keys are never stored raw. The function hashes `nsk_...` with SHA-256 and resolves it through `resolve_mcp_api_key`.
- Revoke a key by setting `api_keys.revoked_at`; revoked keys stop resolving.
- `list_purchased_skills` only returns enabled skills from `user_skill_library.enabled = true`, plus private skills owned by the caller.
- `toggle_skill` is free and only changes the library enabled flag; it does not fetch protected content or reserve credits.
- Credit is deducted only through `usage_events` plus `credit_ledger`, currently via `get_skill_md` and `get_skill_reference`.
