# Phase 1 revision — SePay prepaid MCP credits

Status: founder-confirmed payment direction  
Date: 2026-06-30

## Decision

- Initial market: Vietnam.
- Payment provider: SePay.
- Catalog owner: Nam / nskill only.
- Revenue: users purchase prepaid usage credits; successful MCP invocations consume credits.
- No Stripe, Lemon Squeezy, seller revenue sharing, recurring subscription or postpaid usage invoice in MVP.

## Commercial model

Use one-time VND credit packs:

```text
Trial credits
  → user chooses a top-up pack
  → nskill creates a pending SePay order
  → show VietQR or redirect to SePay checkout
  → SePay webhook confirms money received
  → append credit grant exactly once
  → successful MCP calls append usage debits
```

Pack prices and unit quantities remain beta experiments. Store both values on the order as immutable snapshots so later price changes never alter historical purchases.

## Why prepaid credits fit the MVP

- One-time bank transfer is natural for Vietnamese users.
- nskill can reject MCP execution before balance becomes negative.
- No card authorization for every tiny call.
- No recurring-payment dependency.
- Users understand the maximum amount they can spend.
- Private beta can still begin with administrative trial grants before SePay production activation.

## SePay payment flow

### Create order

`POST /api/billing/orders`

Server responsibilities:

1. Authenticate user.
2. Validate a server-owned active credit pack; never accept price or credits from the browser.
3. Create a cryptographically unpredictable unique order code.
4. Persist amount, credit units, expiration and `pending` status.
5. Return a SePay checkout URL or VietQR details.

### Payment page

- Show exact amount in VND.
- Show unique transfer content/order code.
- Display VietQR and optional SePay-hosted card/payment choices if enabled.
- Poll nskill order status; never poll bank transactions directly from the browser.
- Treat the visual countdown as checkout UX, not proof that a late bank transfer can be discarded safely.

### Webhook

`POST /api/webhooks/sepay`

Required order:

1. Read the raw request body.
2. Verify SePay HMAC-SHA256 for production.
3. Reject unauthenticated/invalid messages before mutation.
4. Require inbound transfer/payment success.
5. Match unique order code and exact expected amount.
6. Deduplicate by SePay transaction ID/reference and internal order ID.
7. Mark order paid and append one credit grant in a single database transaction.
8. Return the success response quickly; downstream analytics must not delay acknowledgment.

SePay retries failed webhook deliveries, so idempotency is mandatory rather than optional.

### Reconciliation

Use SePay transaction APIs as a recovery path when a webhook is delayed or missed. Webhooks provide real-time confirmation; API lookup provides periodic reconciliation. The local order and credit ledger remain nskill’s product source of truth.

## Revised billing entities

### `credit_packs`

- `id`
- `code` unique
- `name`
- `price_vnd` integer
- `credit_units` integer
- `active`
- timestamps

### `payment_orders`

- `id`
- `user_id`, indexed
- `order_code` unique
- `pack_id`
- immutable `amount_vnd` and `credit_units`
- `provider = 'sepay'`
- `provider_order_id` when gateway checkout is used
- `status`: `pending`, `paid`, `expired`, `failed`, `refunded`, `review`
- `expires_at`, `paid_at`, timestamps

### `payment_transactions`

- internal ID
- `payment_order_id`
- unique SePay transaction ID
- unique bank/provider reference where reliable
- transfer type and amount
- transaction timestamp
- reconciliation status
- restricted sanitized provider metadata

### `credit_ledger`

- append-only entry ID
- `user_id`
- signed units
- type: `trial`, `topup`, `usage`, `adjustment`, `refund`, `expiry`, `reservation`, `release`
- unique idempotency/reference key
- payment-order or usage-event reference
- timestamp

### `usage_events`

- unique MCP request/idempotency ID
- user/API-key/skill/version/tool
- units
- status
- timestamps

## Balance and MCP enforcement

Do not store balance as an independently editable source of truth. Derive it from the ledger or maintain a locked cached balance updated atomically with ledger entries.

```text
Authenticate API key
  → validate request
  → atomically reserve units if balance is sufficient
  → execute MCP tool
  → success: finalize reservation as usage
  → failure: append release
```

- Duplicate request IDs never charge twice.
- Authentication/authorization/server failures do not consume credits.
- Insufficient balance fails before skill execution.
- Only trusted server paths can create ledger credits/debits.
- Users can read only their own orders, usage and ledger summaries.

## Late, partial and excess transfers

- Exact amount + exact order code: credit automatically.
- Late but uniquely matched payment: credit automatically or enter review according to the published expiry policy; never silently keep money without credit.
- Partial amount: `review`, no automatic credits.
- Excess amount: `review` unless a clearly documented conversion rule exists.
- Missing/invalid order code: reconciliation queue, not automatic assignment.
- Duplicate webhook: return success without a second credit grant.

## Refund policy consequence

Bank-transfer refunds are operationally different from card reversals. MVP needs a documented support process. A refund must append a negative ledger adjustment; it must not delete the original top-up or payment record. If credits were already consumed, automatic refund may be unavailable and must be disclosed.

## Security requirements

- Keep SePay credentials server-only.
- Use HMAC-SHA256 webhook authentication in production.
- Never trust client-supplied price, credits or paid status.
- Never expose bank transaction APIs to the browser.
- Store minimal sanitized webhook metadata and avoid unnecessary payer personal data.
- Rate-limit order creation and status polling.
- Alert on unmatched, partial, excess and repeated-reference payments.

## Exit criteria

1. Sandbox/test payment creates one paid order and one credit grant.
2. Replayed webhook creates no additional credits.
3. Wrong HMAC, amount or code creates no credits.
4. Payment page reaches paid state through local order polling.
5. Reconciliation can recover a deliberately missed webhook.
6. Successful MCP call debits once; failed call debits zero.
7. Credit balance and ledger reconcile exactly.
