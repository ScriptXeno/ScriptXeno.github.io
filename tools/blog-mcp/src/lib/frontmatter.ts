import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { postsDir } from "./paths.js";

export const STATIC_LQIP =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export interface PostImage {
  path: string;
  alt: string;
  lqip?: string;
}

export interface PostFrontMatter {
  title: string;
  description: string;
  author: string;
  date: string;
  categories: string[];
  tags: string[];
  image: PostImage;
  // Legacy/unrecognized keys (e.g. a stray `parmalink` typo in an old post) are preserved
  // as-is rather than dropped on write.
  [extra: string]: unknown;
}

export interface ParsedPost {
  filename: string;
  data: PostFrontMatter;
  content: string;
}

const KNOWN_KEY_ORDER = [
  "title",
  "description",
  "author",
  "date",
  "categories",
  "tags",
  "image",
] as const;

const YAML_INDICATOR_START = new Set([
  "!",
  "&",
  "*",
  "?",
  "|",
  ">",
  "%",
  "@",
  "`",
  '"',
  "'",
  "#",
  ",",
  "[",
  "]",
  "{",
  "}",
  "-",
  ":",
]);

function looksLikeSpecialScalar(s: string): boolean {
  return /^(true|false|null|~)$/i.test(s) || /^-?\d+(\.\d+)?$/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s);
}

function needsQuoting(s: string, context: "block" | "flow"): boolean {
  if (s.length === 0) return true;
  if (/^\s|\s$/.test(s)) return true;
  if (YAML_INDICATOR_START.has(s[0])) return true;
  if (/:(\s|$)/.test(s)) return true;
  if (/\s#/.test(s)) return true;
  if (looksLikeSpecialScalar(s)) return true;
  if (context === "flow" && /[,[\]{}]/.test(s)) return true;
  return false;
}

function quoteIfNeeded(s: string, context: "block" | "flow"): string {
  return needsQuoting(s, context) ? JSON.stringify(s) : s;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).trim();
}

function indent(lines: string[], spaces: number): string[] {
  const pad = " ".repeat(spaces);
  return lines.map((l) => pad + l);
}

function serializeValue(key: string, value: unknown): string[] {
  switch (key) {
    case "title":
    case "description":
      return [`${key}: ${quoteIfNeeded(String(value), "block")}`];
    case "author":
      return [`author: ${value}`];
    case "date":
      return [`date: ${normalizeDate(value)}`];
    case "categories":
    case "tags": {
      const items = (value as string[]).map((v) => quoteIfNeeded(v, "flow"));
      return [`${key}: [${items.join(", ")}]`];
    }
    case "image": {
      const img = value as PostImage;
      const lines = [`image:`, `  path: ${img.path}`, `  alt: ${quoteIfNeeded(img.alt, "block")}`];
      lines.push(`  lqip: ${img.lqip ?? STATIC_LQIP}`);
      return lines;
    }
    default: {
      // Generic passthrough for legacy/unrecognized keys — best-effort single line.
      if (Array.isArray(value)) {
        const items = value.map((v) => quoteIfNeeded(String(v), "flow"));
        return [`${key}: [${items.join(", ")}]`];
      }
      if (value && typeof value === "object") {
        const lines = [`${key}:`];
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          lines.push(...indent(serializeValue(k, v), 2));
        }
        return lines;
      }
      return [`${key}: ${quoteIfNeeded(String(value), "block")}`];
    }
  }
}

export function serializeFrontMatter(data: PostFrontMatter): string {
  const lines: string[] = [];
  for (const key of KNOWN_KEY_ORDER) {
    if (data[key] === undefined) continue;
    lines.push(...serializeValue(key, data[key]));
  }
  for (const key of Object.keys(data)) {
    if ((KNOWN_KEY_ORDER as readonly string[]).includes(key)) continue;
    if (data[key] === undefined) continue;
    lines.push(...serializeValue(key, data[key]));
  }
  return lines.join("\n") + "\n";
}

export function parsePostFile(raw: string): { data: PostFrontMatter; content: string; rawFrontMatter: string } {
  const parsed = matter(raw);
  const data = parsed.data as PostFrontMatter;
  if ("date" in data) {
    (data as Record<string, unknown>).date = normalizeDate(data.date);
  }
  return { data, content: parsed.content, rawFrontMatter: parsed.matter };
}

export function assemblePostFile(data: PostFrontMatter, content: string): string {
  return `---\n${serializeFrontMatter(data)}---\n${content}`;
}

/** Reassembles a file with its front matter left byte-for-byte untouched — used for
 * body-only edits so formatting/ordering of an existing post's front matter can never drift.
 * gray-matter's `.matter` already carries a leading newline (and no trailing one), so the
 * template only adds the newline before the closing `---`, not after the opening one. */
export function assembleWithRawFrontMatter(rawFrontMatter: string, content: string): string {
  return `---${rawFrontMatter}\n---\n${content}`;
}

export function listPostFiles(): string[] {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

export function loadAllPosts(): ParsedPost[] {
  return listPostFiles().map((filename) => {
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
    const { data, content } = parsePostFile(raw);
    return { filename, data, content };
  });
}

/** Every distinct exact-casing variant seen for each lowercased tag/category across all
 * posts. Kept as a list (not collapsed to one "winner") because real collisions already
 * exist in this corpus (e.g. both "AI" and "ai" are independently established) — picking
 * a winner by first-seen-by-date or by frequency would silently override a deliberate
 * choice, so ambiguous cases are surfaced instead of auto-resolved. */
export function buildCasingVariants(field: "tags" | "categories"): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const post of loadAllPosts()) {
    const values = (post.data[field] as string[] | undefined) ?? [];
    for (const v of values) {
      const list = map.get(v.toLowerCase()) ?? [];
      if (!list.includes(v)) list.push(v);
      map.set(v.toLowerCase(), list);
    }
  }
  return map;
}

/** All distinct exact-casing values for a field across every post — used by list_tags/
 * list_categories, which report reality (including any pre-existing casing collisions)
 * rather than collapsing them the way `buildCasingMap` deliberately does. */
export function listDistinctValues(field: "tags" | "categories"): string[] {
  const seen = new Set<string>();
  for (const post of loadAllPosts()) {
    const values = (post.data[field] as string[] | undefined) ?? [];
    for (const v of values) seen.add(v);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export interface CasingCorrection {
  from: string;
  to: string;
}

export interface CasingAmbiguity {
  input: string;
  existingVariants: string[];
}

/** Reconciles new tags/categories against what's already published:
 * - Exact match to an existing variant (any casing) → kept as-is, nothing to do.
 * - Case-insensitive match to exactly one existing variant → auto-corrected to it.
 * - Case-insensitive match to more than one existing variant (a real collision) → left
 *   as typed, but reported as an ambiguity rather than guessing a winner.
 * - No match at all → treated as a genuinely new tag/category, kept as typed. */
export function reconcileCasing(
  items: string[],
  variants: Map<string, string[]>
): { items: string[]; corrections: CasingCorrection[]; ambiguities: CasingAmbiguity[] } {
  const corrections: CasingCorrection[] = [];
  const ambiguities: CasingAmbiguity[] = [];
  const result = items.map((item) => {
    const existing = variants.get(item.toLowerCase());
    if (!existing || existing.includes(item)) return item;
    if (existing.length === 1) {
      corrections.push({ from: item, to: existing[0] });
      return existing[0];
    }
    ambiguities.push({ input: item, existingVariants: existing });
    return item;
  });
  return { items: result, corrections, ambiguities };
}
