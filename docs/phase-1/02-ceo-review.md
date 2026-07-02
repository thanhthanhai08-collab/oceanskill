# Phase 1.2 — CEO review: founder-confirmed MVP

Status: scope locked for planning  
Date: 2026-06-30

## Executive decision

Build a curated private beta for 10 skill-aware indie hackers. The release proves this loop:

> Discover a skill → purchase or claim it → connect nskill MCP → invoke it from Codex, Claude Code, or Cursor without copying files.

MCP is part of the MVP, not a later enhancement. Secure ZIP download remains a fallback and operational mechanism.

## Locked decisions

| Decision | Result |
| --- | --- |
| Buyer | Indie hacker/solo developer already authoring `SKILL.md` files |
| Channels | X/Twitter, Reddit and Discord communities |
| Launch | Invite-only private beta, 10 users, one month |
| First seller | Nam |
| Initial paid supply | Five original seed skills |
| Additional sellers | 3–5 invited creators, 0% commission for first month |
| Catalog model | Paid skills plus license-compatible free GitHub skills |
| Price | $3–7; default experiment $5 |
| Core value | MCP delivery |
| UI locales | `/vi` and `/en`; seller content remains unchanged |

## NOW — required for beta

- Homepage and concise MCP value demonstration.
- Searchable skill catalog with lightweight taxonomy.
- Skill detail and safe `SKILL.md` preview.
- Free and paid listing states.
- Supabase authentication.
- Lemon Squeezy test-mode checkout for paid skills.
- Verified, idempotent purchase entitlement.
- Private package storage and baseline ZIP validation.
- API-key creation with raw key shown once and only its hash stored.
- MCP authentication and entitlement verification.
- MCP tools:
  - `list_purchased_skills()`
  - `get_skill_content(skill_id)`
  - `search_skills(query)`
- Setup instructions for Codex, Claude Code, and Cursor.
- Minimal buyer dashboard showing entitlements and API-key management.
- Basic scan status communicated as evidence, never as a safety guarantee.

## NEXT — after the MCP loop works

- Verified-purchase ratings and reviews.
- Seller self-service analytics.
- Update notifications and version history.
- Public seller profiles.
- Automated moderation and richer scan reporting.
- Production payment mode.
- Broad SEO and public marketplace launch.

## LATER

- Rules, agents, standalone MCP packages, and references as separate asset types.
- Teams, licensing tiers, subscriptions, bundles, and payout automation.
- Recommendation engine and personalized discovery.

## Explicit non-goals

- Public marketplace scale during the first month.
- Arbitrary executable code inside uploaded packages.
- Translating seller content.
- Supporting every agent client or skill format.
- Guaranteeing that VirusTotal or AI scanning proves a skill safe.
- Update notifications in the first beta.

## Seed catalog

1. `firebase-firestore-architect`
2. `lemon-squeezy-webhook-setup`
3. `zip-security-pipeline`
4. `supabase-rls-policies`
5. `nextjs-seo-jsonld-setup`

Every listing requires an owner, source record, license status, attribution requirements, version, and content hash. GitHub material without a compatible license cannot be republished through nskill.

## Beta acceptance criteria

1. A user can browse free and paid active skills under `/vi` and `/en`.
2. Seller-authored content is identical across locales.
3. Paid entitlement is created only from a valid webhook and remains idempotent.
4. A user can create an `nsk_...` key whose raw value is displayed once.
5. The database stores only the key hash.
6. Revoking the key rejects the next MCP request.
7. MCP lists only free skills and skills the caller owns.
8. MCP returns paid content only after entitlement verification.
9. MCP search returns metadata and a purchase link for unowned paid skills, not protected content.
10. At least one invited user completes purchase-to-invocation without manual file copying.
11. Setup is tested in Codex, Claude Code, and Cursor; unsupported client differences are documented.

## Success metrics

- 10 invited users.
- 5 connect nskill MCP successfully.
- 3 invoke at least one skill.
- 1 completes a paid test purchase and invokes the purchased skill.
- Median account-to-first-invocation time below 10 minutes.
- No protected skill content disclosed to an unentitled key.

## Immediate risks

- MCP client setup may be less portable across Codex, Claude Code, and Cursor than the product promise implies.
- Users may not understand MCP value until they see a live demo.
- Five seed skills may not create enough purchase intent even if MCP works.
- Scan badges can create misleading trust if wording is not calibrated.
- Free GitHub catalog entries create licensing and update-provenance obligations.

## Scope consequence

The previous download-first architecture is superseded. Engineering must promote `api_keys`, MCP transport, entitlement checks, and protected content delivery into the critical path while keeping the marketplace intentionally small.
