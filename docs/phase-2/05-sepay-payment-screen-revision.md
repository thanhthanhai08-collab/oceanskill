# Phase 2 revision — SePay payment screens

Status: ready for implementation  
Date: 2026-06-30

This revision replaces generic Stripe-style subscriptions and saved-card management.

## Revised financial screens

### Credit packs and top-up

- Current credit balance and recent consumption.
- Trial status.
- VND credit-pack cards.
- Primary VietQR action.
- Optional card/payment action routed through SePay-hosted checkout when enabled.
- No recurring-subscription toggle in MVP.

### SePay checkout

- Exact VND amount.
- Dynamic QR.
- Bank recipient and copyable transfer content.
- Unique order code.
- Countdown and local status polling.
- Pending, paid, expired, review and failed states.
- A late-transfer notice that directs users to reconciliation/support instead of implying money disappears.

### Usage dashboard

- Remaining credits.
- Successful MCP usage by day, skill, tool and API key.
- Reservation/pending state when relevant.
- Low-balance and exhausted-balance warnings.
- Link to top up.

### Transaction and credit history

- Separate Payment orders, Bank/provider transactions and Credit ledger tabs.
- VND amounts and credit units.
- Pending/paid/review/refunded states.
- Immutable references for support.
- No raw webhook payload, API key or full bank-account data.

## Screen inventory

The single-vendor MVP remains at 14 product screens. “Billing plans and payment methods” is renamed to “Credit packs and top-up”; there is no seller payout or saved-card screen.
