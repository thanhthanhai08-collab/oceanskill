# Phase 2 revision — Screens for single-vendor usage billing

Status: replaces seller-marketplace screen assumptions  
Date: 2026-06-30

## Revised screen inventory

1. Homepage with MCP usage demo.
2. Skill catalog.
3. Skill detail.
4. MCP onboarding and one-time API-key reveal.
5. Skill leaderboard based on usage and quality.
6. Sign in.
7. Registration.
8. User profile overview.
9. Account settings.
10. My skills: available, recently used and favorites.
11. MCP connection management.
12. Billing plans and payment methods.
13. Usage dashboard.
14. Billing transactions and credit ledger.

Removed: seller upload, seller listings, seller earnings and seller payout methods.

## Leaderboard correction

The leaderboard ranks skills, not creators. Useful columns/signals:

- Successful MCP invocations.
- Unique active users.
- Invocation success rate.
- Verified-usage rating.
- Version freshness.
- Domain and supported clients.

Do not expose individual user activity or fabricate low-volume beta rankings. Use a minimum sample threshold.

## Screen 12 — Billing plans and payment methods

```markdown
Create an authenticated nskill billing page for a single-vendor MCP service. Users choose a plan with included MCP usage units, add prepaid top-ups, and manage a provider-tokenized payment method.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared application shell:** Overview, My skills, MCP connections, Usage, Billing, Account settings.
2. **Current plan summary:** Plan, included units, units used, renewal date and billing status.
3. **Plan comparison:** Trial, Starter and Pro cards emphasizing included usage and predictable limits; all prices and quotas are editable beta content.
4. **Top-up section:** Optional prepaid usage packs with clear unit amount, expiry policy and non-transferable service-credit explanation.
5. **Payment methods:** Provider-rendered masked method metadata and secure hosted/embedded add or update flow. Never use native nskill inputs for complete card or CVV data.
6. **Spending controls:** Usage alerts, automatic top-up opt-in, monthly cap and hard-stop behavior.
7. **Billing links:** Transactions, receipts, refund policy and support.

**INTERACTIONS AND STATES:**
- Include beta-without-provider, trial, active, past-due, canceled, top-up processing and payment failure states.
- In beta-without-provider state, explain that trial usage is active and live billing is not enabled.
- Changes require explicit confirmation and preserve current access until provider webhook confirmation.
```

## Screen 13 — MCP usage dashboard

```markdown
Create an authenticated usage dashboard that lets nskill users understand and control consumption of MCP usage units.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Usage summary:** Remaining units, used this cycle, included quota, forecast and cycle end.
2. **Threshold status:** Progress toward user-configured alerts and hard limit.
3. **Usage timeline:** Daily successful invocation units; distinguish pending/reserved usage from finalized usage.
4. **Breakdown:** Usage by skill, MCP tool, API key and client without exposing prompt or skill content.
5. **Recent events:** Timestamp, skill, tool, units, status and idempotency-safe event reference.
6. **Controls:** Alert thresholds, monthly cap, automatic top-up preference and export usage action.
7. **Explanations:** State clearly that failed authentication, denied entitlement and server failures are not billed.

**INTERACTIONS AND STATES:**
- Include no-usage, delayed reconciliation, quota exhausted and ledger discrepancy states.
- Charts always have accessible tabular equivalents.
- Remaining balance comes from the nskill ledger, not an asynchronous provider summary.
```

## Screen 14 — Billing transactions and credit ledger

```markdown
Create an authenticated billing-history page for nskill showing monetary transactions separately from MCP credit movements.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Primary tabs:** Payments and Usage credits.
2. **Payments table:** Date, provider, type, amount, currency, status, receipt and refund state.
3. **Credit ledger table:** Date, trial/plan/top-up/usage/adjustment/expiry type, units credited or debited, resulting balance and immutable reference.
4. **Filters and export:** Date range, event type, status, skill and API key; CSV export excludes sensitive data.
5. **Reconciliation notice:** Explain pending provider confirmation or delayed meter synchronization without changing real-time access balance.
6. **Support action:** Report a billing discrepancy with the relevant immutable reference preselected.

**INTERACTIONS AND STATES:**
- Refund and adjustment entries remain visible; history is never rewritten.
- Failed payments and failed MCP calls are visually distinct.
- Provider payloads, raw keys and card/bank data never appear.
```
