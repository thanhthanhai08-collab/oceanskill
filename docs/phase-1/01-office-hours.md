# Phase 1.1 — Office hours: founder-validated concept

Status: founder answers confirmed  
Date: 2026-06-30

## Product thesis

nskill is a marketplace for reusable AI-agent skills. Its initial advantage is not simply selling ZIP files: a buyer purchases a skill and can use it from Codex, Claude Code, or Cursor through nskill MCP without manual copying.

## 1. First customer

The initial customer is the intersection of:

- Indie hacker or solo developer.
- Already uses Claude Code, Codex, or Cursor.
- Has written at least one `SKILL.md` for their own project.
- Is active on X/Twitter, Reddit communities such as `r/ClaudeAI`, or relevant Discord servers.

This person needs little format education, tries new tools quickly, and can become both buyer and seller. Agencies and engineering teams are deferred until nskill has case studies and social proof. Geography is secondary to where this audience already gathers online.

## 2. Observed pain and current workaround

Current behavior:

- Copy `SKILL.md` files from GitHub or gists.
- Share files in Discord skill channels.
- Rewrite an existing solution because it cannot be found.
- Run skills without reliable quality or safety signals.

Pain categories:

| Job | Current problem | nskill direction |
| --- | --- | --- |
| Find | Random GitHub keywords, no useful taxonomy | Categories and search |
| Evaluate | No trusted safety or quality signal | Scanning and verified-buyer feedback |
| Install | Manual copy into agent-specific folders | MCP delivery |
| Maintain | No update awareness | Deferred update notifications |

nskill targets the first three jobs in the product vision. Update notifications remain explicitly post-MVP.

## 3. Initial supply

Nam is the first seller and seeds five skills based on directly acquired experience:

1. `firebase-firestore-architect`
2. `lemon-squeezy-webhook-setup`
3. `zip-security-pipeline`
4. `supabase-rls-policies`
5. `nextjs-seo-jsonld-setup`

The second supply cohort is 3–5 invited creators from Discord/X with 0% platform commission during their first month.

Popular free GitHub skills may also be indexed or offered, but only when their licenses permit redistribution. nskill must retain required attribution and license notices. “Public on GitHub” does not automatically mean “free to repackage or sell.”

## 4. Test price and willingness to pay

Target price: **USD $3–7 per paid skill**, with $5 as the default experiment.

The paid value is reduced time and risk:

- Security and instruction-content checks.
- Feedback from verified purchasers.
- Immediate MCP use instead of manual copying.
- Seller incentive to support and update the product.

Free, properly licensed skills remain part of the catalog and serve acquisition. Paid skills must offer a stronger trust, convenience, support, or specialization proposition than a free GitHub alternative.

## 5. One core MVP value

**MCP installation and use is the core value.**

Curated discovery needs inventory and behavioral data before it compounds. Secure paid download alone is not sufficiently differentiated. MCP is the reason to choose nskill and return after the first visit; therefore roadmap Phase 7 moves into the MVP critical path.

Target demo:

> Purchase a skill → connect nskill MCP → invoke the purchased skill from the IDE without copying files.

## 6. Launch target

Private beta with 10 users within one month.

The beta should not present itself as a mature public marketplace. Its purpose is to verify the MCP-delivered purchase loop with curated content before investing in broad marketplace supply or SEO acquisition.

## Confirmed validation gates

- Persona: skill-aware indie hacker/solo developer using a supported coding agent.
- Initial format: `SKILL.md`-based skills.
- Initial seller: Nam, followed by 3–5 invited creators.
- Initial catalog: five owned skills plus license-compatible free entries.
- Price experiment: $3–7, default $5.
- Differentiator: MCP delivery.
- Beta target: 10 invited users in one month.

## Remaining evidence gaps

- Interview at least three target users; competitor observation is useful but is not equivalent to direct user evidence.
- Confirm that all five seed skills contain original or properly licensed material.
- Test whether users understand “MCP delivery” as a benefit without technical explanation.
- Determine whether one API key can support all three initial clients with acceptable setup friction.
- Define what “AI content scan passed” means without implying a guarantee of safety.
