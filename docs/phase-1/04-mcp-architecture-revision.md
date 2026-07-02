# Phase 1.3 addendum — MCP-first architecture revision

Status: required revision  
Date: 2026-06-30

This document supersedes any MCP-deferred decision in `03-engineering-review.md`.

## Revised critical path

```text
Curated listing
  → free claim or paid checkout
  → entitlement in Supabase
  → user creates nsk_ API key
  → MCP request hashes key and resolves user
  → tool checks public/free status or purchase
  → protected SKILL.md returned to supported client
```

## New MVP components

- `api_keys` table with `key_hash`, owner, name, timestamps and revocation.
- Server-only API-key creation that returns the raw key once.
- Constant-time key verification where applicable.
- MCP transport endpoint and three tools.
- Entitlement service shared by MCP and secure download.
- Content/version metadata so an invocation identifies exactly what was served.
- License/provenance metadata for free GitHub catalog entries.

## Security invariants

- Raw API keys are never stored or logged.
- Key prefixes identify key type, not the owner.
- MCP authentication failure returns `401`; missing entitlement returns `403`.
- Search never returns protected skill content.
- Service-role credentials remain server-only.
- Revocation is checked against the database on every protected MCP request; stale JWT claims are not used for API-key authorization.
- Rate limits apply per key and IP before expensive content or scan operations.

## Schema additions

### `api_keys`

- `id uuid primary key`
- `user_id uuid not null`, indexed
- `key_hash text unique not null`
- `name text not null`
- `last_used_at timestamptz`
- `created_at timestamptz not null default now()`
- `revoked_at timestamptz`

RLS permits owners to list key metadata and revoke their own keys. Hash lookup and `last_used_at` updates happen only through the trusted MCP server path. No response returns `key_hash`.

### `skills` additions

- `access_type`: `free` or `paid`
- `version`
- `content_hash`
- `source_url`
- `license_spdx`
- `attribution_text`

### Entitlements

Keep paid purchases immutable. Free access can be determined from `skills.access_type = 'free'`; a separate claim row is unnecessary unless product analytics or per-user licensing requires one.

## Tool contracts

### `list_purchased_skills()`

Returns owned paid skills plus currently active free skills. The response includes IDs, title, version, domain and invocation metadata, but not full protected content unless the protocol explicitly needs it.

### `get_skill_content(skill_id)`

Authenticates the key, loads the active version, verifies free access or purchase, then returns the skill content and integrity metadata. Returns `403` for an unowned paid skill.

### `search_skills(query)`

Returns public metadata and localized marketplace links. An unowned paid result contains no protected content.

## Required prototype before full marketplace design

Build a vertical MCP spike with one hard-coded/free test skill:

1. Generate and hash one API key.
2. Connect from Codex.
3. Call `list_purchased_skills()`.
4. Call `get_skill_content()`.
5. Revoke the key and prove the next call fails.
6. Repeat connection testing in Claude Code and Cursor.

This spike is the highest-risk assumption. It should be completed before investing in all marketplace screens.
