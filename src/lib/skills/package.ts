import "server-only";
import {createHash} from "node:crypto";
import {Unzip, UnzipInflate} from "fflate";
import {preflightSkillZip} from "@/lib/skills/zip-preflight";

const maxArchiveBytes = 5 * 1024 * 1024;
const maxReferenceBytes = 1024 * 1024;
const maxExpandedBytes = 5 * 1024 * 1024;
const maxReferenceFiles = 50;

const textExtensions = new Set([
  "md", "txt", "json", "yaml", "yml", "js", "mjs", "cjs", "ts", "tsx", "jsx",
  "py", "sh", "bash", "zsh", "ps1", "rb", "go", "rs", "toml", "xml", "html",
  "css", "csv", "sql",
]);
const binaryExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const forbiddenNames = /(^|\/)(?:\.env(?:\..*)?|serviceaccountkey\.json|credentials?\.json|[^/]+\.(?:pem|key|p12|pfx))$/i;
const recognizableSecrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:sk|ghp|github_pat|xox[baprs])-[_a-z0-9-]{16,}\b/i,
  /\bservice_role\b\s*[:=]\s*["']?[a-z0-9._-]{20,}/i,
];

export type PrivateSkillReference = Readonly<{
  referenceKey: string;
  bytes: Uint8Array;
  mimeType: string;
  contentHash: string;
}>;

export type PrivateSkillPackage = Readonly<{
  skillMd: string;
  references: PrivateSkillReference[];
  checks: Array<{id: string; passed: boolean; message: string}>;
}>;

function extension(path: string) {
  const name = path.split("/").at(-1) ?? "";
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
}

function mimeTypeFor(path: string) {
  const ext = extension(path);
  if (ext === "md") return "text/markdown; charset=utf-8";
  if (["txt", "sh", "bash", "zsh", "py", "rb", "go", "rs", "sql"].includes(ext)) return "text/plain; charset=utf-8";
  if (["js", "mjs", "cjs"].includes(ext)) return "application/javascript; charset=utf-8";
  if (["ts", "tsx", "jsx"].includes(ext)) return "text/plain; charset=utf-8";
  if (ext === "json") return "application/json; charset=utf-8";
  if (["yaml", "yml"].includes(ext)) return "application/yaml; charset=utf-8";
  if (ext === "xml") return "application/xml; charset=utf-8";
  if (ext === "html") return "text/html; charset=utf-8";
  if (ext === "css") return "text/css; charset=utf-8";
  if (ext === "csv") return "text/csv; charset=utf-8";
  if (ext === "png") return "image/png";
  if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

function validateArchivePath(value: string) {
  const path = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!path || path.startsWith("/") || /^[a-z]:\//i.test(path) || path.includes("\0")) throw new Error("invalid_bundle_path");
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error("invalid_bundle_path");
  return path;
}

function decodeUtf8(bytes: Uint8Array, errorCode: string) {
  try {
    return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
  } catch {
    throw new Error(errorCode);
  }
}

async function unzipWithLimits(file: File) {
  if (file.size <= 0 || file.size > maxArchiveBytes) throw new Error("invalid_bundle_size");
  if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("invalid_bundle_type");

  const archiveBytes = new Uint8Array(await file.arrayBuffer());
  preflightSkillZip(archiveBytes);
  const entries = new Map<string, Uint8Array>();
  const names = new Set<string>();
  let expandedBytes = 0;
  let failure: Error | null = null;
  const unzipper = new Unzip((entry) => {
    if (failure) return;
    if (entry.name.endsWith("/")) {
      entry.ondata = () => undefined;
      entry.start();
      return;
    }

    let path: string;
    try {
      path = validateArchivePath(entry.name);
    } catch (error) {
      failure = error instanceof Error ? error : new Error("invalid_bundle_path");
      return;
    }
    const folded = path.toLocaleLowerCase("en-US");
    if (names.has(folded)) {
      failure = new Error("invalid_bundle_duplicate_path");
      return;
    }
    names.add(folded);

    const chunks: Uint8Array[] = [];
    let entryBytes = 0;
    entry.ondata = (error, chunk, final) => {
      if (failure) return;
      if (error) {
        failure = new Error("invalid_bundle_zip");
        return;
      }
      entryBytes += chunk.length;
      expandedBytes += chunk.length;
      if (entryBytes > maxReferenceBytes || expandedBytes > maxExpandedBytes) {
        failure = new Error("invalid_bundle_expanded_size");
        return;
      }
      chunks.push(chunk);
      if (final) {
        const bytes = new Uint8Array(entryBytes);
        let offset = 0;
        for (const value of chunks) {
          bytes.set(value, offset);
          offset += value.length;
        }
        entries.set(path, bytes);
      }
    };
    entry.start();
  });
  unzipper.register(UnzipInflate);

  try {
    unzipper.push(archiveBytes, true);
  } catch {
    throw new Error("invalid_bundle_zip");
  }
  if (failure) throw failure;
  return entries;
}

export async function parsePrivateSkillPackage(value: FormDataEntryValue | null): Promise<PrivateSkillPackage | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  const entries = await unzipWithLimits(value);
  const skillMdPaths = [...entries.keys()].filter((path) => /(^|\/)skill\.md$/i.test(path));
  if (skillMdPaths.length !== 1) throw new Error("invalid_bundle_skill_md");

  const skillMdPath = skillMdPaths[0];
  const rootPrefix = skillMdPath.slice(0, -"SKILL.md".length);
  const references: PrivateSkillReference[] = [];
  const referenceNames = new Set<string>();

  for (const [archivePath, bytes] of entries) {
    if (!archivePath.startsWith(rootPrefix)) throw new Error("invalid_bundle_multiple_roots");
    const referenceKey = archivePath.slice(rootPrefix.length);
    if (!referenceKey || /^skill\.md$/i.test(referenceKey)) continue;
    if (referenceKey.length > 240 || forbiddenNames.test(referenceKey)) throw new Error("invalid_bundle_reference_path");
    const ext = extension(referenceKey);
    if (!textExtensions.has(ext) && !binaryExtensions.has(ext)) throw new Error("invalid_bundle_reference_type");
    const folded = referenceKey.toLocaleLowerCase("en-US");
    if (referenceNames.has(folded)) throw new Error("invalid_bundle_duplicate_reference");
    referenceNames.add(folded);
    if (references.length >= maxReferenceFiles) throw new Error("invalid_bundle_file_count");

    if (textExtensions.has(ext)) {
      const content = decodeUtf8(bytes, "invalid_bundle_reference_utf8");
      if (content.includes("\0") || recognizableSecrets.some((pattern) => pattern.test(content))) throw new Error("invalid_bundle_reference_secret");
    }

    references.push({
      referenceKey,
      bytes,
      mimeType: mimeTypeFor(referenceKey),
      contentHash: createHash("sha256").update(bytes).digest("hex"),
    });
  }

  const skillMd = decodeUtf8(entries.get(skillMdPath)!, "invalid_bundle_skill_md_utf8");
  return {
    skillMd,
    references,
    checks: [
      {id: "bundlePaths", passed: true, message: "Safe relative package paths"},
      {id: "bundleSize", passed: true, message: `Expanded package within 5 MiB (${expandedBytesLabel(entries)})`},
      {id: "bundleBomb", passed: true, message: "ZIP structure and compression ratio preflight passed"},
      {id: "bundleSecrets", passed: true, message: "No recognizable secrets or credential files"},
      {id: "bundleExecution", passed: true, message: "Scripts stored as references and never executed by OceanSkill"},
      {id: "bundleFiles", passed: true, message: `${references.length} verified reference files`},
    ],
  };
}

function expandedBytesLabel(entries: Map<string, Uint8Array>) {
  const bytes = [...entries.values()].reduce((sum, value) => sum + value.length, 0);
  return `${bytes.toLocaleString("en-US")} bytes`;
}
