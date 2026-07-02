# Phase 2.1 — Design review: MCP-first private beta

Status: ready for Stitch generation  
Date: 2026-06-30

## Design objective

Make the MCP advantage understandable before asking users to learn marketplace mechanics.

The product should communicate one loop visually:

> Find a skill → purchase or claim → connect once → invoke from the IDE.

The interface serves experienced agent users. It should feel precise and credible, not like a generic course marketplace or an unexplained cybersecurity dashboard.

## Primary experience principles

1. **Show the mechanism.** Use real command/config examples and an invocation result rather than abstract “AI-powered” claims.
2. **Trust is evidence, not decoration.** Display scan time, version, source/license, content hash summary and verified-purchase status where applicable.
3. **One dominant action per state.** Before ownership: Get or Buy. After ownership: Use with MCP. Before connection: Connect client.
4. **Seller content is locale-independent.** Translate interface chrome only; never imply that skill content was translated.
5. **Progressive disclosure.** Keep advanced metadata and raw setup details available without placing them ahead of the first invocation.

## Core user states

| State | Primary action | Required feedback |
| --- | --- | --- |
| Anonymous, unowned | Sign in to get skill | Preserve intended return URL |
| Signed in, free skill | Add to library | Immediate entitlement confirmation |
| Signed in, paid skill | Buy for $5 | Clear test-mode checkout transition |
| Owned, MCP disconnected | Connect Codex/Claude/Cursor | Copyable client-specific setup |
| Owned, MCP connected | Use skill | Invocation example and content availability |
| Revoked/invalid key | Create or replace key | No ambiguous generic error |

## Screen priority

### P0 — generate first

1. Homepage with MCP demo.
2. Marketplace listing and search/filter.
3. Skill detail with ownership-aware CTA.
4. MCP connection/API-key onboarding.

### P1 — generate after P0 review

5. Buyer library/dashboard.
6. Invited seller upload/review form.
7. Checkout return states: processing, unlocked, failed.

Full seller analytics, reviews feed, public seller profiles, and general settings are not part of this pass.

## Screen-level review requirements

### Homepage

- Hero explains MCP delivery in one sentence.
- Product demo shows a three-step sequence: purchase, connect, invoke.
- Initial catalog is visible without forcing signup.
- Trust section distinguishes “scanned” from “guaranteed safe.”
- CTA wording targets skill-aware users; avoid beginner education.

### Marketplace

- Search is the dominant control.
- Filters: free/paid and domain; asset type is fixed to skill for beta.
- Cards expose price, version, seller, compatibility and evidence badges.
- Empty/loading/error states are designed, not left to implementation.

### Skill detail

- Above the fold: title, seller, price/access, compatibility, CTA.
- Preview preserves original language.
- Trust evidence has timestamps and expandable details.
- License/source is visible for imported free skills.
- Owned state replaces purchase CTA with MCP action.

### MCP onboarding

- Client tabs for Codex, Claude Code and Cursor.
- Raw API key shown once with explicit acknowledgement.
- Copy controls and verification step.
- Success state demonstrates the first tool call.
- Revocation is separated from routine actions and requires confirmation.

## Anti-patterns to reject

- Generic gradient hero with no product mechanism.
- Fake activity charts or marketplace counts during private beta.
- “100% safe” or shield imagery without verifiable evidence.
- Five equal CTAs competing in the hero.
- Hiding license information for GitHub-sourced entries.
- Showing protected `SKILL.md` content before entitlement.
- Treating a copied API key as recoverable after the one-time reveal.

## Accessibility and responsive baseline

- Keyboard-accessible search, filters, tabs, dialogs and copy actions.
- Visible focus states and text alternatives for status icons.
- Do not use color as the only indicator for scan/payment/key status.
- Mobile layout keeps CTA and price visible without sticky obstruction.
- Code blocks scroll horizontally and retain copy controls.
- Minimum interactive target size appropriate for touch.

## Design acceptance criteria

- A target user can explain nskill’s MCP advantage after viewing the homepage for 10 seconds.
- Every screen has exactly one obvious next action for its current user state.
- Free, paid, owned and disconnected states are visually distinguishable without relying only on color.
- API-key creation clearly communicates “shown once.”
- The design never promises absolute safety.
- P0 screens cover the complete discovery-to-first-invocation story.

## Current blocker

The Stitch generation tools are not available in the active Codex session. These requirements and enhanced prompts are ready; screen generation resumes when Stitch MCP is connected/reloaded.
