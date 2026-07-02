# Phase 1.3 — Engineering review: private-beta architecture

Status: architecture baseline  
Date: 2026-06-30

## Scope

This architecture implements only the `NOW` scope in the CEO review: curated skills, discovery, Supabase authentication, Lemon Squeezy test checkout, idempotent purchase recording, validated private ZIP storage, and purchase-gated download.

It deliberately does not implement MCP delivery, API keys, reviews, multiple asset types, or automated AI/antivirus scanning.

## System boundary

```text
Browser
  │
  ├── public pages ───────────────► Next.js server rendering
  │                                  │
  ├── authenticated actions ──────► Next.js route handlers/actions
  │                                  │
  │                                  ├──► Supabase Auth
  │                                  ├──► Supabase Postgres + RLS
  │                                  ├──► Supabase private Storage
  │                                  └──► Lemon Squeezy API
  │
Lemon Squeezy webhook ────────────► Next.js webhook handler
                                     │ verify raw-body HMAC first
                                     └──► privileged purchase upsert
```

The browser never receives a service-role key, Lemon API key, webhook secret, or permanent private-storage URL.

## Architectural decisions

### ADR-001 — Next.js remains the application boundary

Use the current Next.js App Router application for SSR pages, authenticated mutations, checkout creation, webhook receipt, and secure download redirects. Do not introduce a separate API service for the private beta.

Reason: one deployable unit is easier to validate. The future MCP service remains a separate boundary because its transport and uptime profile differ.

### ADR-002 — Supabase enforces ownership and entitlement

Application checks improve error messages, but Postgres RLS remains the final row-level authorization boundary. Every table in `public` has RLS enabled. Policies specify roles with `TO` and combine them with ownership predicates.

### ADR-003 — Public metadata and private package data are separated

The `skills` row contains public listing metadata and a private `zip_path`. Anonymous reads must not expose `zip_path`.

Preferred implementation: expose an explicit public projection through server-side queries. If a database view is introduced, it must use `security_invoker = true`; otherwise views can bypass underlying RLS.

### ADR-004 — Downloads are authorized server-side

The download route verifies the current user and an existing purchase, then creates a signed URL valid for at most five minutes. Storage objects stay private. The signed URL is an ephemeral capability and must not be persisted or logged.

### ADR-005 — Webhook is the payment source of truth

A checkout redirect does not grant access. Only a webhook with a valid HMAC signature can create a purchase. `lemon_order_id` is unique so webhook retries are safe.

### ADR-006 — ZIP validation occurs before activation

An upload is never written directly as an active listing. Validation runs in a temporary server-side workspace; only a passing artifact moves to private Storage and becomes eligible for manual activation.

## Routes for the MVP

| Route | Rendering | Access | Responsibility |
| --- | --- | --- | --- |
| `/[locale]` | SSR | Public | Homepage |
| `/[locale]/skills` | SSR | Public | Active marketplace listings and domain filter |
| `/[locale]/skills/[slug]` | SSR | Public | Listing detail and sanitized preview |
| `/[locale]/login` | SSR + actions | Public | Authentication |
| `/[locale]/dashboard` | Dynamic server | Authenticated | Purchases and downloads |
| `/[locale]/upload` | Server shell + client form | Invited seller | Submit package for review |
| `/api/checkout/create` | Route handler | Authenticated | Create test checkout |
| `/api/webhook/lemon` | Route handler | Signed webhook | Verify and upsert entitlement |
| `/api/download/[skillId]` | Route handler | Authenticated buyer | Create five-minute signed URL |

API routes remain locale-neutral. User-facing redirect URLs carry the chosen locale explicitly.

## Minimal schema

### `profiles`

| Column | Notes |
| --- | --- |
| `id uuid primary key` | References `auth.users(id)` |
| `email text` | Display/contact; do not use for authorization |
| `display_name text` | Optional |
| `avatar_url text` | Optional |
| `is_seller boolean` | Invitation flag; server-managed |
| `created_at timestamptz` | Default `now()` |

### `skills`

| Column | Notes |
| --- | --- |
| `id uuid primary key` | Generated UUID |
| `seller_id uuid` | References `profiles(id)`, indexed |
| `slug text unique` | Stable public URL |
| `title text` | Seller content; not translated |
| `description text` | Seller content; not translated |
| `price_cents integer` | Non-negative integer; avoid floating point |
| `currency text` | MVP fixed to configured currency |
| `domain text` | Check constrained to `development` or `productivity` |
| `preview_md text` | Sanitized/size-limited preview |
| `zip_path text` | Private object path; never select into public payloads |
| `status text` | `draft`, `pending`, `active`, `rejected` |
| `created_at`, `updated_at` | Timestamps |

### `purchases`

| Column | Notes |
| --- | --- |
| `id uuid primary key` | Generated UUID |
| `buyer_id uuid` | References `profiles(id)`, indexed |
| `skill_id uuid` | References `skills(id)`, indexed |
| `amount_cents integer` | Payment snapshot |
| `currency text` | Payment snapshot |
| `lemon_order_id text unique` | Idempotency key |
| `created_at timestamptz` | Default `now()` |

Add a unique constraint on `(buyer_id, skill_id)` for the MVP if repeat purchases are not supported.

## Authorization matrix

| Resource/action | Anonymous | Buyer | Seller owner | Trusted server |
| --- | --- | --- | --- | --- |
| Read active public skill fields | Allow | Allow | Allow | Allow |
| Read non-active skill | Deny | Deny | Own rows | Allow |
| Read `zip_path` | Deny | Deny directly | Own rows only if operationally needed | Allow |
| Insert skill | Deny | Deny | Own row when invited | Allow |
| Update skill | Deny | Deny | Own row; cannot self-activate | Allow |
| Read purchase | Deny | Own rows | No | Allow |
| Insert purchase | Deny | Deny | Deny | Valid webhook only |
| Read ZIP object | Deny | Signed URL after entitlement | Own upload workflow | Allow |

Seller status and administrative authorization must not rely on user-editable `user_metadata`. Use a server-owned profile field or `app_metadata`; account for JWT staleness if authorization is stored in JWT claims.

## RLS policy shape

Policy details are finalized in Phase 3, but the required shape is fixed now:

- Enable RLS on `profiles`, `skills`, and `purchases`.
- Public skill SELECT policy allows only `status = 'active'`; sensitive columns are excluded by query boundary or explicit privileges.
- Seller SELECT/INSERT/UPDATE policies require `(select auth.uid()) = seller_id`.
- UPDATE policies include both `USING` and `WITH CHECK`, plus a matching SELECT policy.
- Buyer purchase SELECT requires `(select auth.uid()) = buyer_id`.
- Browser roles receive no purchase INSERT privilege.
- Index all ownership columns used by RLS.
- Storage policies are bucket- and path-specific; service-role access is server-only.

## Purchase sequence

```text
Buyer         Next.js              Lemon              Supabase
  │ click Buy    │                    │                    │
  ├─────────────►│ verify user/skill  │                    │
  │              ├───────────────────►│ create checkout    │
  │◄─────────────┤ checkout URL       │                    │
  ├──────────────────────────────────►│ pay                │
  │              │◄───────────────────┤ webhook(raw body)  │
  │              │ verify HMAC        │                    │
  │              ├────────────────────────────────────────►│ upsert order ID
  │              │                    │                    │
  ├─────────────►│ request download   │                    │
  │              ├────────────────────────────────────────►│ verify purchase
  │              ├────────────────────────────────────────►│ signed URL ≤5m
  │◄─────────────┤ redirect           │                    │
```

## Upload state machine

```text
draft → validating → pending → active
             │          │
             └──────────┴──► rejected
```

The public schema may keep only roadmap statuses (`draft`, `pending`, `active`, `rejected`); `validating` can be an application/job state. No client request can set `active` directly.

## Failure paths

| Failure | Required behavior |
| --- | --- |
| Session missing during checkout | `401`, no Lemon request |
| Skill inactive or price mismatch | `404`/`409`, no checkout |
| Checkout API unavailable | Retryable response; no entitlement |
| Invalid webhook signature | `401`, no parsing-dependent mutation |
| Duplicate valid webhook | Return success, one purchase row |
| Unknown user/skill in webhook | Record structured operational error; no partial purchase |
| Purchase missing at download | `403`, no storage call |
| Storage signed URL failure | `503`, do not leak `zip_path` |
| ZIP exceeds limits | Reject before persistent upload |
| ZIP contains traversal or forbidden type | Reject and delete temporary files |

## Validation and test matrix

### Unit

- HMAC verification with valid, invalid, and modified raw bodies.
- ZIP path normalization, NUL bytes, extension allowlist, size and ratio boundaries.
- Locale-neutral content mapping.

### Database/RLS

- Anonymous sees active skills only.
- Seller sees and updates only owned rows.
- Seller cannot change ownership or activate a skill.
- Buyer sees only own purchases.
- Authenticated non-buyer cannot infer entitlements.
- Duplicate `lemon_order_id` cannot create a second row.

### Integration

- Checkout uses the database price, never a client-provided amount.
- Valid webhook unlocks download.
- Invalid/duplicate webhook behavior is deterministic.
- Signed download URL expires within five minutes.

### End-to-end

- Browse in `/vi`, switch to `/en`, and confirm seller content is unchanged.
- Sign in, purchase in test mode, return, download, and install.
- Repeat as a non-purchaser and receive `403`.

## Implementation order

1. Phase 2 designs only the seven MVP screens.
2. Phase 3 creates the three-table schema, RLS policies, and private bucket.
3. Seed curated listings and build public SSR marketplace routes.
4. Build minimal seller upload and validation pipeline.
5. Add Lemon checkout and verified idempotent webhook.
6. Add purchase dashboard and signed download.
7. Run security, RLS, and end-to-end tests before enabling real payments.

## Architecture exit criteria

- Product scope maps to a route, entity, and owner.
- Trust boundaries and secrets are explicit.
- Every privileged mutation has a server-side authorization rule.
- Payment and upload retries are safe.
- Future MCP work can read purchases without changing the purchase model.
- No Phase 2+ feature is accidentally required for the first transaction.

## References

- Supabase Row Level Security documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase signed downloads: https://supabase.com/docs/guides/storage/serving/downloads
