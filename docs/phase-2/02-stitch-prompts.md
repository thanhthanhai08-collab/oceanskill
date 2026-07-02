# Phase 2.2 — Enhanced Stitch prompts

These prompts describe layout, content and behavior only. Project-level design tokens should be supplied through the Stitch design system rather than embedded in generation prompts.

## Screen 1 — Homepage with MCP demo

```markdown
Create the desktop-first homepage for nskill, a private-beta marketplace where experienced Codex, Claude Code, and Cursor users discover skills and invoke purchased skills through MCP without copying files manually.

**PLATFORM:** Web, desktop-first with a complete responsive mobile layout

**PAGE STRUCTURE:**
1. **Sticky navigation bar:** nskill wordmark, Marketplace link, compact locale switcher for VI/EN, Sign in action, and a primary “Explore skills” action. Keep navigation focused; do not show enterprise or pricing menus.
2. **Hero section:** A precise headline explaining “Buy once. Use skills directly in your coding agent.” Add supporting copy for skill-aware indie hackers. Include one primary “Explore skills” CTA and one secondary “See MCP demo” action.
3. **Interactive product demonstration:** A three-step horizontal sequence—choose a skill, connect nskill MCP once, invoke the skill in Codex/Claude/Cursor. Show realistic command or tool-call snippets and a successful result panel. On mobile, stack the steps vertically.
4. **Curated beta catalog:** Responsive card grid containing the five seed skills. Cards show seller, free or $5 price, version, supported clients, domain, and concise scan evidence. Include hover and keyboard-focus states.
5. **Trust evidence section:** Explain package validation, VirusTotal result, AI content-check result, license/source provenance, and verified-purchase feedback as separate evidence types. Include a short disclaimer that scans reduce risk but do not guarantee safety.
6. **Creator invitation:** Compact section inviting experienced skill authors to join the beta with 0% platform commission for the first month.
7. **Footer:** Terms, Privacy, DMCA, FAQ, GitHub/source policy, locale links, and private-beta status.

**INTERACTIONS AND STATES:**
- Marketplace cards expose free, paid, and owned states without relying only on color.
- Demo steps support keyboard navigation.
- Locale switching translates interface labels but leaves seller-authored skill titles and descriptions unchanged.
- Avoid fabricated user counts, revenue, review totals, testimonials, or absolute safety claims.
```

## Screen 2 — Marketplace

```markdown
Create a desktop-first nskill marketplace page for technical users who already understand SKILL.md and want to find reusable skills quickly.

**PLATFORM:** Web, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Sticky navigation bar:** Product navigation consistent with the homepage, with Marketplace shown as the active destination.
2. **Marketplace heading:** Compact title, private-beta catalog count, and a short explanation that seller content remains in its original language.
3. **Search and filter toolbar:** Dominant search input with keyboard shortcut hint; filters for All/Free/Paid, Development/Productivity, compatibility with Codex/Claude Code/Cursor, and sort by Relevance/Newest/Price. Do not include an asset-type filter because the beta supports skills only.
4. **Results area:** Responsive card grid. Each card shows original title, seller, one-line description, price/access status, version, domain, compatible clients, license/source when imported, scan timestamp, and ownership state.
5. **Pagination and states:** Design skeleton loading, no-results guidance, filter error, and normal pagination states.
6. **Beta feedback strip:** Invite users to request a missing skill or nominate a creator.
7. **Footer:** Legal and provenance links.

**INTERACTIONS AND STATES:**
- Search terms and filters are reflected in the URL.
- Filter chips are removable and keyboard accessible.
- Owned cards use “Use with MCP”; unowned paid cards use “View skill”; free cards use “Get free.”
- Never expose protected skill content in card previews.
```

## Screen 3 — Skill detail

```markdown
Create a desktop-first nskill skill-detail page that supports free, paid, and already-owned states while making trust evidence and MCP delivery concrete.

**PLATFORM:** Web, desktop-first and responsive

**PAGE STRUCTURE:**
1. **Header and breadcrumbs:** Marketplace navigation, localized interface breadcrumbs, and original skill title.
2. **Primary detail area:** Two-column layout. Main column contains title, seller, original-language description, compatibility, version, domain, update date, and a sanitized SKILL.md preview. Side purchase panel contains free or $5 price, ownership state, primary action, and a concise “Delivered through nskill MCP” explanation.
3. **Trust evidence panel:** Separate rows for ZIP structural validation, VirusTotal result, AI content-check result, content hash, scan timestamp, license, source repository, and attribution. Add expandable methodology details and a non-guarantee disclaimer.
4. **How to use section:** Three steps—add or buy, connect MCP once, invoke from the selected client. Include client tabs with short examples but route full setup to onboarding.
5. **Version and support section:** Current version, seller support/update statement, and future update-notification note without promising an unavailable feature.
6. **Related skills:** Small curated row, not an algorithmic recommendation claim.
7. **Footer:** Legal, reporting, and provenance links.

**INTERACTIONS AND STATES:**
- Anonymous action asks the user to sign in and preserves return location.
- Paid action opens checkout; processing state prevents duplicate checkout actions.
- Owned action becomes “Use with MCP.” If MCP is disconnected, route to setup; if connected, show an invocation example.
- Preview must never reveal protected full content.
```

## Screen 4 — MCP connection and API key onboarding

```markdown
Create a focused MCP onboarding page for nskill users connecting Codex, Claude Code, or Cursor for the first time.

**PLATFORM:** Web application, desktop-first with responsive mobile behavior

**PAGE STRUCTURE:**
1. **Authenticated application header:** nskill, Library, MCP Connection, API Keys, locale control, and account menu.
2. **Progress header:** Four-step indicator—Choose client, Create key, Configure client, Verify connection.
3. **Client selector:** Accessible tabs for Codex, Claude Code, and Cursor with concise compatibility notes.
4. **API-key creation card:** Name input, create action, and security explanation. The generated `nsk_...` value appears once in a prominent one-time reveal panel with copy action, acknowledgement checkbox, and warning that it cannot be recovered.
5. **Configuration panel:** Client-specific command or configuration block with copy action. Never interpolate the raw key into analytics or logs.
6. **Verification panel:** “Test connection” action, loading state, success state showing the first `list_purchased_skills()` result, and actionable errors for invalid, revoked, or missing keys.
7. **Existing keys:** Metadata-only list showing name, created time, last used time and status. Revocation is a secondary destructive action with confirmation.
8. **Next action:** On success, offer “Open your library” and show an example `get_skill_content()` invocation.

**INTERACTIONS AND STATES:**
- Copy buttons provide non-color confirmation.
- Raw key disappears permanently after acknowledgement/navigation.
- Error messages distinguish connection, authentication, entitlement and client-configuration failures.
- Mobile code blocks scroll without hiding copy controls.
```
