import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260717082905_creator_slots_and_public_platform_collections.sql", import.meta.url);

test("creator slots cost exactly 5,000 VND each and are applied idempotently after payment", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /p_amount_vnd % 5000 <> 0/i);
  assert.match(sql, /amount_vnd = skill_slots::bigint \* 5000/i);
  assert.match(sql, /if v_order\.status = 'paid' then return 'already_paid'/i);
  assert.match(sql, /set creator_skill_limit = creator_skill_limit \+ v_order\.skill_slots/i);
  assert.match(sql, /revoke all on function public\.create_creator_slot_payment_order[\s\S]+grant execute[\s\S]+to service_role/i);
});

test("uploaded skill cards hide hashes and use the signed-in profile identity", async () => {
  const [card, page, creatorData] = await Promise.all([
    readFile(new URL("../src/components/dashboard/CreatorSkillList.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/skills/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/skills/creator.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(card, /SHA-256|skill_md_hash/);
  assert.match(card, /ownerName/);
  assert.match(page, /ownerName=\{creatorData\.owner\.name\}/);
  assert.match(creatorData, /select\("creator_skill_limit,display_name,avatar_url,email"\)/);
});

test("dashboard navigation stays within its layout and creator slot UX follows the purchased allowance", async () => {
  const [sidebar, layout, dashboard, addCard, tabs, billing, viMessages, enMessages, viDashboard, enDashboard] = await Promise.all([
    readFile(new URL("../src/components/dashboard/DashboardSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/dashboard/CreatorSkillAddCard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/dashboard/DashboardSkillsTabs.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/billing/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../messages/vi/creator-skills.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/en/creator-skills.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/vi/dashboard.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/en/dashboard.json", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(sidebar, /roleLabel/);
  assert.doesNotMatch(layout, /roleLabel/);
  assert.match(sidebar, /fixed inset-y-0 left-0/);
  assert.match(sidebar, /invisible -translate-x-full pointer-events-none/);
  assert.match(sidebar, /visible translate-x-0/);
  assert.match(sidebar, /overflow-y-auto overscroll-contain/);
  assert.match(sidebar, /lg:max-h-\[calc\(100dvh-6rem\)\]/);
  assert.match(sidebar, /lg:overflow-y-auto/);
  assert.match(sidebar, /scrollbar-hidden/);
  assert.match(sidebar, /document\.body\.style\.overflow = "hidden"/);
  assert.match(dashboard, /payment-gradient/);
  assert.match(dashboard, /bg-white[^\n]+text-\[#18181b\]/);
  assert.doesNotMatch(viDashboard, /Không gian riêng/);
  assert.doesNotMatch(enDashboard, /Private workspace/);
  assert.match(addCard, /showFreePlanHint &&/);
  assert.match(addCard, /hasPurchasedSlots \? labels\.limitTitle : labels\.noSlotsTitle/);
  assert.match(tabs, /showFreePlanHint=\{limit <= 5\}/);
  assert.match(tabs, /hasPurchasedSlots=\{limit > 5\}/);
  assert.match(billing, /topup\?purpose=creator-slots&amount=5000/);
  assert.match(viMessages, /Gói miễn phí chỉ cho phép đăng 5 skill/);
  assert.match(enMessages, /The free plan allows up to 5 uploaded skills/);
});

test("platform collections are public in the marketplace but dashboard reads only the user's library", async () => {
  const [sql, marketplaceLayout, marketplace, sidebar, collectionPage, homePage, hotCollections, dashboard] = await Promise.all([
    readFile(migrationUrl, "utf8"),
    readFile(new URL("../src/app/[locale]/skills/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/skills/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/skills/CategorySidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/skills/collections/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/home/HotCollections.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/[locale]/dashboard/collections/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(sql, /for select to anon, authenticated[\s\S]+collection_type = 'platform'/i);
  assert.match(marketplaceLayout, /getPlatformSkillCollections/);
  assert.match(marketplaceLayout, /platformCollections=\{platformCollections\}/);
  assert.doesNotMatch(marketplace, /getPlatformSkillCollections|collectionsTitle/);
  assert.match(sidebar, /\/skills\/collections\/\$\{collection\.slug\}/);
  assert.match(sidebar, /activeCollection === collection\.slug/);
  assert.match(collectionPage, /AddPlatformCollectionButton/);
  assert.match(homePage, /getPlatformSkillCollections/);
  assert.match(hotCollections, /collections\.slice\(0, 3\)/);
  assert.match(hotCollections, /collection\.name/);
  assert.doesNotMatch(hotCollections, /mockData|collections\.\$\{collection\.id\}/);
  assert.doesNotMatch(dashboard, /getPlatformSkillCollections/);
  assert.match(dashboard, /initialCollections=\{collections\}/);
});
