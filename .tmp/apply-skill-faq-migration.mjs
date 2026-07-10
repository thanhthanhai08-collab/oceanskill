import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => { const i = line.indexOf("="); return [line.slice(0, i), line.slice(i + 1)]; }));
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const sql = fs.readFileSync("supabase/migrations/20260710120000_skill_faqs.sql", "utf8");
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {method: "POST", headers: {Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json"}, body: JSON.stringify({query: sql})});
if (!response.ok) throw new Error(`Migration failed: HTTP ${response.status} ${await response.text()}`);
console.log(JSON.stringify({applied: true, migration: "skill_faqs"}));
