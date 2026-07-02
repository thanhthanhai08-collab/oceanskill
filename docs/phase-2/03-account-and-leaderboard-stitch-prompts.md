# Phase 2.3 — Leaderboard and account-area Stitch prompts

These prompts are ready for Stitch after Codex reloads the newly configured MCP server. They use project-level design tokens and therefore contain no hard-coded palette or typography instructions.

## Screen 5 — Creator leaderboard

```markdown
Create a desktop-first leaderboard for nskill’s private-beta community, helping experienced coding-agent users discover reputable skill creators without fabricating marketplace activity.

**PLATFORM:** Web, desktop-first with responsive mobile layout

**PAGE STRUCTURE:**
1. **Sticky navigation bar:** nskill branding, Marketplace, Leaderboard as the active item, MCP Setup, locale switcher, and account action.
2. **Leaderboard introduction:** Compact page title explaining that rankings reward verified usefulness and responsible maintenance. Include a transparent “How ranking works” action.
3. **Time and metric controls:** Tabs for This month and All time; metric selector for Overall, Verified purchases, Successful MCP uses, Rating, and Maintained skills. During private beta, disable metrics without sufficient data and explain why.
4. **Top creators:** A restrained podium-style summary for the top three creators showing rank, profile identity, verified creator status, number of active skills, primary domains, and evidence-backed score breakdown.
5. **Ranked creator table:** Rank, creator, active skills, verified purchases, average verified rating, successful MCP uses, latest maintenance activity, and trend. Every metric includes an accessible definition tooltip.
6. **Rising creators:** Small section for new invited sellers, clearly labeled separately from the main ranking.
7. **Ranking methodology drawer:** Explain weighting, minimum sample size, anti-gaming rules, update schedule, and excluded activity.
8. **Footer:** Marketplace, creator invitation, legal, methodology, and locale links.

**INTERACTIONS AND STATES:**
- Design honest empty and low-data private-beta states; never show invented numbers.
- Sorting is keyboard accessible and reflected in the URL.
- Creator rows link to profiles only when public profiles are enabled.
- Rank changes use text and icons in addition to color.
- Flag suspicious or insufficient data rather than presenting false precision.
```

## Screen 6 — Sign in

```markdown
Create a focused sign-in screen for nskill users returning to manage purchased skills and MCP connections.

**PLATFORM:** Web, responsive desktop and mobile

**PAGE STRUCTURE:**
1. **Minimal header:** nskill wordmark linking home and a VI/EN locale switcher.
2. **Authentication card:** “Welcome back” heading, concise explanation, email field, password field with visibility control, forgot-password link, primary sign-in action, and link to create an account.
3. **OAuth options:** Continue with GitHub and Continue with Google, separated clearly from email/password authentication.
4. **Context panel:** On wide screens, show a concise MCP benefit demonstration and privacy reassurance. Remove this panel on narrow screens rather than squeezing the form.
5. **Footer:** Terms, Privacy, and support link.

**INTERACTIONS AND STATES:**
- Preserve the intended return path after authentication.
- Include inline validation, submitting, invalid credentials, rate-limit, provider failure, and successful redirect states.
- Do not reveal whether an arbitrary email exists.
- All fields and provider buttons are keyboard accessible with visible focus.
```

## Screen 7 — Create account

```markdown
Create a concise registration screen for skill-aware indie developers joining the nskill private beta as buyers who may later become sellers.

**PLATFORM:** Web, responsive desktop and mobile

**PAGE STRUCTURE:**
1. **Minimal header:** nskill wordmark, private-beta label, and VI/EN locale switcher.
2. **Registration card:** Heading, short beta expectation, display name, email, password, password requirements, terms/privacy consent, and primary “Create account” action.
3. **OAuth options:** GitHub and Google registration choices.
4. **Invitation context:** If an invite code is present, show who or which program invited the user without exposing private data. If the beta is closed, show a waitlist state instead of a broken form.
5. **Seller intent:** Optional non-blocking checkbox asking whether the user already authors skills; do not add a long onboarding questionnaire.
6. **Footer:** Terms, Privacy, and existing-account sign-in link.

**INTERACTIONS AND STATES:**
- Include email confirmation, existing account, invalid/expired invite, password validation, provider failure, and success states.
- Consent must be explicit and not preselected.
- Preserve locale and return path through confirmation.
```

## Screen 8 — User profile overview

```markdown
Create an authenticated nskill user-profile overview that summarizes identity, purchased/free skills, creator status, MCP connection health, and the next useful action.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Application shell:** Header with nskill, Marketplace, Leaderboard and locale controls; collapsible side navigation with Overview, My skills, MCP connections, Account settings, and Seller workspace when eligible.
2. **Profile summary:** Avatar, display name, username, join date, creator verification state, and edit-profile action.
3. **Quick status cards:** Skill library count, active MCP clients, API keys requiring attention, and seller listings. Avoid vanity charts.
4. **Continue using skills:** Recent owned skills with version, last MCP use, client compatibility, and primary “Use with MCP” actions.
5. **MCP health:** Connected clients, last successful request, revoked/expired key warnings, and “Manage connections” action.
6. **Creator summary:** Only for sellers; listing statuses and next operational action.
7. **Activity timeline:** Security-relevant account and entitlement events with clear timestamps, excluding sensitive tokens or content.

**INTERACTIONS AND STATES:**
- Provide buyer-only, invited-seller, empty-library, disconnected-MCP, and account-warning states.
- Do not show protected keys, hashes, or full skill content.
- Mobile navigation becomes a labeled drawer with preserved focus behavior.
```

## Screen 9 — Account settings

```markdown
Create an authenticated account-settings page for nskill with safe identity, localization, session, and account-management controls.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared application shell:** Side navigation with Account settings active.
2. **Profile settings:** Avatar, display name, username, and public-profile preview where enabled.
3. **Preferences:** Interface language VI/EN, timezone, and product/security notification controls. Skill content language is not translated and should not appear as a preference.
4. **Authentication:** Connected GitHub/Google identities, add/remove provider actions, password update flow, and email verification status.
5. **Active sessions:** Device/browser, approximate location, last active time, current-session label, revoke action, and revoke-all-other-sessions action.
6. **Data and privacy:** Data export request and privacy information.
7. **Danger zone:** Delete account with impact summary covering purchases, seller listings, API keys, and retained transaction/legal records.

**INTERACTIONS AND STATES:**
- Destructive actions use confirmation dialogs and recent-authentication checks.
- Provider removal is prevented when it would leave no sign-in method.
- Changes provide inline success/error feedback without losing form state.
```

## Screen 10 — Skill management

```markdown
Create an authenticated “My skills” workspace that separates a buyer’s library from a seller’s listings while keeping MCP use as the primary action.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared application shell:** Side navigation with My skills active.
2. **Primary tabs:** Library and My listings. Hide My listings for users without seller access and provide a clear invitation path.
3. **Library toolbar:** Search, Free/Paid filter, domain filter, MCP compatibility filter, and sort by Recently used/Recently added/Updated.
4. **Library list or grid:** Skill title, seller, access type, installed/available version, supported clients, last MCP use, scan evidence, and primary “Use with MCP” action. Show update availability as informational because automatic notifications are post-MVP.
5. **Seller listings table:** Draft/Pending/Active/Rejected status, version, price, purchases, last update, scan status, and contextual edit/submit/view actions.
6. **Upload action:** Primary action for invited sellers, leading to the validated ZIP workflow.
7. **States:** Empty library, no search results, pending review, rejected listing with reason, and MCP disconnected.

**INTERACTIONS AND STATES:**
- Protected content is never rendered in list previews.
- Seller cannot activate their own listing from this screen.
- Bulk destructive actions are excluded from private beta.
- URL preserves active tab, filters and sort.
```

## Screen 11 — MCP connection management

```markdown
Create an authenticated MCP-management page for nskill users to understand client connections, manage API keys safely, test tools, and troubleshoot access.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared application shell:** Side navigation with MCP connections active.
2. **Connection overview:** Codex, Claude Code, and Cursor cards showing configured/not configured, last successful request, associated key name, and test-connection action.
3. **API-key table:** Metadata only—name, masked prefix, created time, last used time, status, and client labels. Include create-key and revoke actions; never show stored hash or recoverable raw value.
4. **Tool inspector:** Read-only list of `list_purchased_skills`, `get_skill_content`, and `search_skills`, with concise purpose, authentication requirement, and a safe test action.
5. **Recent MCP activity:** Timestamp, client, tool, outcome, and latency without request content or secrets.
6. **Troubleshooting panel:** Actionable states for missing authorization header, invalid key, revoked key, missing entitlement, rate limit, and server unavailable.
7. **Setup documentation:** Client-specific tabs and copyable commands/configuration, with a link back to guided onboarding.

**INTERACTIONS AND STATES:**
- Creating a key uses a one-time reveal flow.
- Revocation requires confirmation and explains immediate impact.
- Test results distinguish authentication, entitlement, network and configuration failures.
- Copy feedback and connection states use text in addition to icons or color.
```

## Screen 12 — Buyer payment methods

```markdown
Create an authenticated buyer payment-methods page for nskill that remains provider-independent while directing sensitive card entry through a payment-provider hosted or embedded component.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared application shell:** Side navigation with Billing and payments active.
2. **Payment-provider status:** Explain which provider currently processes purchases and that nskill does not store complete card numbers or security codes.
3. **Saved payment methods:** Provider-supplied masked card brand, last four digits, expiry month/year, default status, and billing identity summary. Include set-default and remove actions only when supported by the active provider.
4. **Add payment method:** Launch a provider-hosted or provider-embedded secure form. The nskill layout contains the surrounding instructions and progress state but never renders native inputs for full card number or CVV.
5. **Billing details:** Name, country, address and tax/business fields where required, synchronized through the provider rather than duplicated without purpose.
6. **Purchase history link:** Route to Transactions for receipts, refunds and entitlement status.
7. **Provider portability:** Explain that available payment methods can differ by provider, country and device without exposing implementation details.

**INTERACTIONS AND STATES:**
- Include provider loading, authentication challenge, declined card, expired card, unsupported country, successful tokenization, removal failure and no-saved-method states.
- Never display, log or submit full card data through nskill-controlled endpoints.
- Removing the default method requires choosing a replacement when an active recurring obligation exists.
- The Lemon Squeezy MVP state may show “Payment methods are managed securely during checkout” rather than an add-card form.
```

## Screen 13 — Seller payout methods

```markdown
Create an authenticated seller payout-methods page for nskill that supports the Lemon Squeezy affiliate beta and a future marketplace payout provider without storing raw bank or debit-card details.

**PLATFORM:** Web application, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Shared seller application shell:** Seller overview, Listings, Earnings, Payout methods, Tax and verification, and account navigation.
2. **Payout status summary:** Current provider, onboarding status, verification requirements, payout eligibility, next estimated payout date and minimum threshold.
3. **Connected payout destinations:** Provider-returned masked bank account or debit-card information, payout currency, country, default status and verification state. Do not expose account or routing numbers.
4. **Add or update destination:** Launch provider-hosted or embedded onboarding for bank account, debit card, identity verification and required documents. Keep users inside nskill visually when embedded components are supported.
5. **Beta provider card:** For Lemon Squeezy affiliates, show connection status and a secure action leading to the Affiliate Hub to configure bank or PayPal payout details.
6. **Future provider card:** Reserved provider-neutral state for a marketplace payout integration such as connected-account onboarding; do not let sellers activate two payout providers for the same earnings ledger.
7. **Payout schedule and fees:** Hold period, payout cadence, minimum balance, provider fees and currency-conversion notice.
8. **Security and audit:** Recent payout-destination changes, verification events and account-protection guidance without sensitive values.

**INTERACTIONS AND STATES:**
- Include not started, onboarding incomplete, under review, enabled, restricted, payout failed and provider unavailable states.
- Adding or changing payout destinations requires recent authentication and provider verification.
- The UI must distinguish nskill’s earnings estimate from provider-confirmed payable balance.
- Never collect or store full bank account, routing, debit-card or identity-document data in nskill forms or database.
```
