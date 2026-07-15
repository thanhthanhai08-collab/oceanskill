import "server-only";
import {createHash} from "node:crypto";

const categories = new Set(["ai-agent", "security", "productivity", "design", "marketing", "development", "research"]);
const clients = new Set(["codex", "claude-code", "cursor", "generic-mcp"]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:sk|ghp|github_pat|xox[baprs])-[_a-z0-9-]{16,}\b/i,
  /\bservice_role\b\s*[:=]\s*["']?[a-z0-9._-]{20,}/i,
];
const dangerousPatterns = [
  /\brm\s+-rf\s+(?:\/|~|\$HOME)\b/i,
  /\b(?:curl|wget)\b[^\n|]{0,300}\|\s*(?:sh|bash|zsh)\b/i,
  /(?:upload|send|exfiltrate).{0,80}(?:credential|secret|token|private key)/i,
];

export type PrivateSkillInput = Readonly<{
  title: string; slug: string; description: string; category: string; version: string;
  compatibleClients: string[]; sourceUrl: string | null; licenseSpdx: string | null; content: string;
}>;

export type SkillScan = Readonly<{
  passed: boolean; contentHash: string; checks: Array<{id: string; passed: boolean; message: string}>;
}>;

function clean(value: FormDataEntryValue | null) { return typeof value === "string" ? value.trim() : ""; }

export function parsePrivateSkillForm(formData: FormData): PrivateSkillInput {
  const title = clean(formData.get("title"));
  const slug = clean(formData.get("slug")).toLowerCase();
  const description = clean(formData.get("description"));
  const category = clean(formData.get("category"));
  const version = clean(formData.get("version"));
  const content = clean(formData.get("content"));
  const sourceUrlValue = clean(formData.get("sourceUrl"));
  const licenseValue = clean(formData.get("licenseSpdx"));
  const compatibleClients = formData.getAll("compatibleClients").map(String).filter((item) => clients.has(item));
  if (title.length < 2 || title.length > 160) throw new Error("invalid_title");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) throw new Error("invalid_slug");
  if (description.length < 10 || description.length > 1000) throw new Error("invalid_description");
  if (!categories.has(category)) throw new Error("invalid_category");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error("invalid_version");
  if (!compatibleClients.length) throw new Error("missing_client");
  if (sourceUrlValue && (!URL.canParse(sourceUrlValue) || !sourceUrlValue.startsWith("https://"))) throw new Error("invalid_source_url");
  if (licenseValue.length > 80) throw new Error("invalid_license");
  return {title, slug, description, category, version, compatibleClients, sourceUrl: sourceUrlValue || null, licenseSpdx: licenseValue || null, content};
}

export function scanSkillContent(content: string): SkillScan {
  const bytes = Buffer.byteLength(content, "utf8");
  const checks = [
    {id: "size", passed: bytes >= 80 && bytes <= 262_144, message: "80 B–256 KiB"},
    {id: "format", passed: /^#{1,2}\s+.+/m.test(content), message: "Markdown heading present"},
    {id: "nullBytes", passed: !content.includes("\0"), message: "No NUL bytes"},
    {id: "secrets", passed: !secretPatterns.some((pattern) => pattern.test(content)), message: "No recognizable secrets"},
    {id: "commands", passed: !dangerousPatterns.some((pattern) => pattern.test(content)), message: "No high-risk command pattern"},
  ];
  return {passed: checks.every((check) => check.passed), contentHash: createHash("sha256").update(content, "utf8").digest("hex"), checks};
}
