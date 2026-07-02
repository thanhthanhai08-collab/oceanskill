# OceanSkill application architecture

OceanSkill follows the useful parts of the 4AIVN structure while replacing Firebase with Supabase SSR and Postgres RLS.

## Route flow

1. `src/app/[locale]/**/layout.tsx` owns route metadata, canonical URLs, hreflang, robots directives, and structured data.
2. `page.tsx` coordinates server data and composes the screen. Pages should stay thin.
3. `src/components/` owns reusable presentation grouped by domain: `layout`, `home`, `skills`, `leaderboard`, `dashboard`, and `seo`.
4. `src/lib/` owns server data access and domain logic. Supabase calls must not be embedded in visual components.
5. `messages/{locale}/` owns every user-facing or SEO-facing sentence.

## Supabase boundary

- Public catalog pages use the publishable key and the `skills_select_active` RLS policy.
- Protected pages validate identity with `supabase.auth.getClaims()` on the server.
- Dashboard queries remain user-scoped by RLS even after server authentication.
- The service role is restricted to server-only billing and MCP operations and must never enter a client component.
- Creator-owned skills are forced to `visibility = private`; owner RLS protects metadata and versions while MCP re-checks the API key, ownership, active version, and scan result on every content call.
- Public catalog queries require both `status = active` and `visibility = public`, so a creator cannot make a private upload discoverable by changing browser input.

## Private creator publishing gate

1. Validate the signed Supabase session on the server.
2. Enforce owner-only rows with Postgres RLS.
3. Normalize and size-limit every submitted field.
4. Reject recognizable secrets, destructive bootstrap commands, and malformed Markdown.
5. Hash every immutable version with SHA-256.
6. Force creator submissions to private visibility at both RLS and column-privilege layers.
7. Re-authorize the live MCP key, owner, active version, scan status, rate limit, and credit reservation for each protected content call.

## SEO and GEO

- `src/lib/seo/site.ts` is the single source for canonical URLs, locale alternates, Open Graph, Twitter, and indexing policy.
- `src/lib/seo/schema.ts` builds Organization, WebSite, BreadcrumbList, ItemList, and SoftwareApplication JSON-LD.
- `src/app/sitemap.ts` lists public localized routes and active Supabase skills.
- `src/app/robots.ts` excludes account, login, and API routes.
- `src/app/llms.txt/route.ts` publishes a concise, public-only guide for AI crawlers. Protected skill content is never included.
- `NEXT_PUBLIC_SITE_URL` must be set to the production origin before deployment.
