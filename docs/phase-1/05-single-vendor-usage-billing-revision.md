# Phase 1 revision — Single-vendor MCP usage business

Status: superseded by `06-sepay-prepaid-credits-revision.md` for payment-provider details  
Date: 2026-06-30

## Final ownership model for MVP

- Nam owns and publishes every skill in the nskill catalog.
- nskill is not a third-party seller marketplace in the MVP.
- No seller onboarding, seller commissions, affiliate attribution, or seller payouts.
- Third-party sellers remain a possible future phase only after a compliant payout model is selected.
- Imported open-source material still requires compatible licenses and attribution, but it is not represented as a seller listing.

## Revenue model

Skills are not sold individually. Users pay for successful MCP usage.

The product loop becomes:

```text
Create account
  → receive trial usage
  → connect nskill MCP
  → search/list available skills
  → invoke a skill
  → record usage units once
  → deduct included quota or prepaid balance
  → show usage and billing history
```

## Recommended commercial model

Use **subscription with included usage plus optional prepaid top-ups**, rather than charging a card for every individual MCP request.

Reasons:

- Avoid payment-processing fees on tiny transactions.
- Give users predictable monthly spend.
- Allow nskill to stop requests before a user exceeds quota.
- Keep the billing provider replaceable.
- Support free trial usage without creating invoices.

Initial prices and quotas are experiments, not locked product facts. A reasonable beta test is:

| Plan | Test entitlement |
| --- | --- |
| Trial | 50 usage units, one-time |
| Starter | 500 units/month |
| Pro | 2,000 units/month |
| Top-up | Additional prepaid units |

Do not equate one HTTP request with one billable unit. A successful MCP tool execution is the billable event. Expensive tools may consume multiple units later, but MVP should begin with one successful invocation = one unit.

## Beta without a live payment provider

The private beta can proceed before Stripe or another provider is connected:

1. Grant trial units administratively.
2. Validate MCP connection, invocation, metering, quota enforcement and user understanding.
3. Display a simulated plan/usage page clearly marked as beta.
4. Add real checkout only after the usage loop is reliable.

This prevents payment integration from blocking the highest-risk product assumption.

## Billing source of truth

nskill owns the real-time usage ledger. A future provider receives aggregated/idempotent usage for invoicing, but provider meter summaries must not decide whether an MCP call is allowed because external aggregation can be asynchronous.

### Required entities

#### `plans`

- provider-independent plan code
- display name
- included usage units
- billing interval
- active status

#### `billing_accounts`

- user owner
- active plan
- provider name
- provider customer/subscription references
- billing status

#### `usage_events`

- immutable unique event ID
- user ID and API-key ID
- MCP tool and skill ID/version
- usage units
- result status
- occurred timestamp
- idempotency key

#### `credit_ledger`

- append-only credit/debit entry
- user ID
- units
- entry type: trial, plan grant, top-up, usage, adjustment, expiry
- reference to usage event or external transaction
- created timestamp

#### `payment_transactions`

- provider-independent transaction ID
- provider and external reference
- amount/currency
- type: subscription, top-up, refund, adjustment
- status
- raw provider payload stored only in a restricted audit boundary when required

## MCP charging sequence

```text
Authenticate API key
  → resolve user
  → validate tool and entitlement
  → reserve usage with idempotency key
  → execute tool
  → on success: finalize debit once
  → on failure: release reservation
  → return result and remaining quota metadata
```

Rules:

- Retries with the same idempotency key cannot charge twice.
- Authentication failures, authorization failures and server failures are not billed.
- Streaming/disconnected requests need an explicit completion rule before billing.
- Only trusted server code can insert usage debits or billing adjustments.
- Users can read their own usage and transaction summaries but cannot mutate ledger rows.

## Provider strategy

### Preferred future integration

Stripe Billing supports usage meters and meter events for API-request-style billing. nskill should sync summarized or idempotent usage to the provider while retaining its own enforcement ledger.

### Alternative

Any provider can be integrated behind a small billing adapter if it supports customer creation, recurring plans or top-ups, payment method tokenization, webhook verification, refunds and transaction reconciliation.

### Never build

- Raw card-number or CVV collection on nskill servers.
- A mutable `balance` column without an append-only ledger behind it.
- Per-call payment authorization against the card network.
- Access decisions based only on an asynchronous provider meter.

## Features removed from MVP

- Seller registration and verification.
- Seller upload workflow.
- Seller dashboard and analytics.
- Affiliate program.
- Seller earnings and payout methods.
- Revenue-share calculation.
- Per-skill checkout and purchase entitlement.
- Verified-purchase reviews; replace later with verified-usage feedback.

## Features retained or changed

- Catalog and skill detail pages remain.
- MCP onboarding and API-key management remain core.
- Buyer payment methods becomes Account billing methods.
- Transactions becomes Billing and credit history.
- Skill library becomes available/recently used skills; no purchase ownership needed.
- Leaderboard ranks skills by privacy-safe usage and quality signals, not creators or revenue.

## MVP acceptance criteria

1. A new user receives trial units.
2. One successful MCP invocation creates exactly one immutable usage event and debit.
3. Retrying the same request does not create a second debit.
4. Failed or unauthorized calls do not consume units.
5. A user with insufficient units receives a clear quota error before execution.
6. Revoking an API key blocks the next request.
7. Usage history and remaining units reconcile with the ledger.
8. Admin adjustments create new ledger entries rather than modifying history.
9. The usage loop works without any live payment provider.
10. A future provider can be added without changing MCP authorization or usage-event semantics.
