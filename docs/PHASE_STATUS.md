# nskill delivery status

Updated: 2026-07-02

## Phase 0 — Setup

| Item | Status | Notes |
| --- | --- | --- |
| Codex + gstack | Done | gstack installed for Codex; restart required to load its skills |
| Stitch skills | Done | Present in `.agents/skills` and `stitch-skills` |
| Next.js App Router + Tailwind | Done | Current project uses Next.js 16 and Tailwind 4 |
| next-intl | Done | Required locale prefixes: `/vi` and `/en` |
| Supabase SSR auth foundation | Done | Login, signup, callback, protected dashboard |
| shadcn/ui | Pending verification | Not listed as an installed app dependency yet |
| GitHub → Vercel auto-deploy | Pending verification | Requires external project/deployment state |
| Production environment variables | Pending | Keep real secrets out of Git; `.env.example` remains the contract |

## Phase 1 — Validate

| Deliverable | Status | Output |
| --- | --- | --- |
| Office hours / concept pressure test | Founder confirmed | `docs/phase-1/01-office-hours.md` |
| CEO review / MVP scope | Scope locked | `docs/phase-1/02-ceo-review.md` |
| Engineering review / architecture | MCP-first revision required | `docs/phase-1/03-engineering-review.md`, `docs/phase-1/04-mcp-architecture-revision.md` |
| Business-model revision | Founder confirmed | Single-vendor catalog; revenue from MCP usage only; `docs/phase-1/05-single-vendor-usage-billing-revision.md` |
| Payment-provider revision | Founder confirmed | SePay prepaid VND credits; no Stripe/Lemon; `docs/phase-1/06-sepay-prepaid-credits-revision.md` |

## Phase 2 — Design

| Deliverable | Status | Output |
| --- | --- | --- |
| MCP-first design review | Complete | `docs/phase-2/01-design-review.md` |
| Enhanced Stitch prompts | Ready | `docs/phase-2/02-stitch-prompts.md` |
| Stitch MCP connection | Configured; restart required | Codex config now includes `mcp_servers.stitch` |
| P0 Stitch screens | Ready after Codex restart | Homepage, marketplace, skill detail, MCP onboarding |
| Account and community prompts | Ready | Leaderboard, sign in, registration, profile, settings, skill management, MCP management |
| Financial account prompts | Superseded | Seller payout removed; account billing retained in usage-billing revision |
| Usage-billing revision | Ready | 14-screen single-vendor inventory; seller screens removed; `docs/phase-2/04-usage-billing-screen-revision.md` |
| SePay payment screens | Ready | Credit packs, VietQR checkout, usage and ledger; `docs/phase-2/05-sepay-payment-screen-revision.md` |

Phase 2 status: **complete for implementation**. The local `stitch-oceanskill` export is the visual reference; the single-vendor and SePay revisions override older seller/Stripe/Lemon assumptions.

## Phase 3 — Supabase foundation

| Deliverable | Status | Output |
| --- | --- | --- |
| Core schema and RLS | Ready locally; remote apply blocked by connector write timeout | `supabase/schema.sql` |
| SePay order + webhook crediting RPC | Ready locally | `create_sepay_payment_order`, `apply_sepay_payment` |
| MCP credit reservation/finalization | Ready locally | `reserve_mcp_usage`, `finalize_mcp_usage`, `release_mcp_usage` |
| API-key secret separation | Ready locally | Public metadata + private SHA-256 hash table |
| Next.js server integration | Build verified | Billing order/status, SePay webhook and API-key routes |
| Remote database verification | Blocked | Supabase connector can list project/tables but write and SQL calls time out |
| P1 Stitch screens | Pending P0 review | Library, seller upload, checkout states |

## Phase 4 — Private creator skills

| Deliverable | Status | Output |
| --- | --- | --- |
| Creator skill management | Build ready | `/[locale]/dashboard/skills` |
| Private-by-default ownership | Migration ready | `owner_id`, `visibility`, owner RLS and column grants |
| Seven-step publishing gate | Build ready | Server validation, static scan, SHA-256 version, private enforcement |
| MCP transport | Build ready | `/api/mcp` with authenticated discovery, search and protected content calls |
| Lemon Squeezy | Removed from current path | SePay remains the documented prepaid-credit provider; no Lemon dependency is used |
| Remote migration verification | Pending | Apply the new migration when Supabase SQL/CLI access is available |

## Working rule

Complete Phase 1 in order: concept → scope → architecture. Do not begin marketplace implementation from unconfirmed assumptions.
