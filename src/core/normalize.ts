/**
 * Pure normalization + heuristics used by parsing, cleaning, dedupe and diff.
 * No platform APIs: operates on strings and Uint8Array so it runs in both the
 * browser worker and Node tests.
 */

import type { EncodingName } from "./types.js";
import { ValidationError } from "./errors.js";
import { ERROR_MESSAGES } from "./errors.js";

/* ------------------------------------------------------------------ */
/* Encoding sniffing (pure byte logic)                                 */
/* ------------------------------------------------------------------ */

const BOM_UTF8 = [0xef, 0xbb, 0xbf];
const BOM_UTF16LE = [0xff, 0xfe];
const BOM_UTF16BE = [0xfe, 0xff];

/** Detect the likely text encoding of raw bytes. */
export function sniffEncoding(bytes: Uint8Array): EncodingName {
  if (bytes.length >= 3 && bom(bytes, BOM_UTF8)) return "utf-8";
  if (bytes.length >= 2 && bom(bytes, BOM_UTF16LE)) return "utf-16le";
  if (bytes.length >= 2 && bom(bytes, BOM_UTF16BE)) return "utf-16be";

  // UTF-16 without BOM: plenty of NUL bytes in ASCII-heavy text.
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  let zerosEven = 0; // NUL at even index → likely UTF-16LE ("A" = 41 00)
  let zerosOdd = 0;  // NUL at odd index  → likely UTF-16BE ("A" = 00 41)
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0x00) (i % 2 === 0 ? zerosEven++ : zerosOdd++);
  }
  if (sample.length >= 16 && zerosEven + zerosOdd > sample.length * 0.2) {
    return zerosEven >= zerosOdd ? "utf-16le" : "utf-16be";
  }
  return "latin1";
}

function bom(bytes: Uint8Array, expected: number[]): boolean {
  for (let i = 0; i < expected.length; i++) if (bytes[i] !== expected[i]) return false;
  return true;
}

/** Binary quick-check: reject obviously binary content before decoding. */
export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 512));
  let suspicious = 0;
  for (const b of sample) {
    // Control characters other than tab, LF, CR are bad news in text files.
    if (b < 0x09 || (b > 0x0d && b < 0x20 && b !== 0x1f)) suspicious++;
  }
  return sample.length > 0 && suspicious / sample.length > 0.05;
}

/** Reject null bytes within the first sample (classic sign of an xlsx/zip). */
export function containsNul(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 1024));
  for (const b of sample) if (b === 0x00) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Trim edges and collapse whitespace runs, Unicode-aware. */
export function tidyText(value: string, collapse: boolean): string {
  // \s covers Unicode whitespace in JS regex emca-4 definition
  if (collapse) return value.replace(/\s+/gu, " ").trim();
  return value.trim();
}

/** Case + trim-insensitive comparison key for headers. */
export function headerKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Auto-rename duplicate column names case-insensitively: id, id → id, id (2). */
export function resolveDuplicateHeaders(headers: string[]): { headers: string[]; renamed: Record<number, string> } {
  const renamed: Record<number, string> = {};
  const seen = new Map<string, number>();
  const out = headers.map((h, i) => {
    const base = h;
    const key = headerKey(base);
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n === 1) return base;
    const candidate = `${base} (${n})`;
    renamed[i] = candidate;
    return candidate;
  });
  return { headers: out, renamed };
}

/** Are all provided header names distinct after trimming/casing? */
export function hasDuplicateHeaders(headers: string[]): boolean {
  const set = new Set<string>();
  for (const h of headers) {
    const k = headerKey(h);
    if (set.has(k)) return true;
    set.add(k);
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Row helpers                                                         */
/* ------------------------------------------------------------------ */

export function isBlankRow(cells: string[]): boolean {
  return cells.every((c) => c.trim() === "");
}

/** Normalize a key composed of selected columns. */
export function makeKey(
  row: readonly string[],
  columns: number[] | null,
  opts: { trim: boolean; caseSensitive: boolean; emptyTokens?: string[] }
): string {
  if (columns === null) {
    // full-row mode: whole row, optionally normalized
    let s = row.join("\u001f");
    if (opts.trim) s = tidyText(s, false);
    if (!opts.caseSensitive) s = s.toLowerCase();
    return s;
  }
  const parts: string[] = [];
  for (const c of columns) {
    let v = row[c] ?? "";
    if (opts.trim) v = v.trim();
    if (opts.emptyTokens && opts.emptyTokens.includes(v.toLowerCase()) ) v = "";
    if (!opts.caseSensitive) v = v.toLowerCase();
    parts.push(v);
  }
  return parts.join("\u001f");
}

/* ------------------------------------------------------------------ */
/* ID-like column heuristics                                           */
/* ------------------------------------------------------------------ */

const ID_HEADER_HINTS =
  /(^|[^\w])(id|ids|no$|number|code|sku|upc|ean|gtin|phone|mobile|zip|postal|pin|pincode|tax|gst|pan|invoice|order|account|customer|serial|imei|part)([^\w]|$)/i;

/** Heuristic: does this column look like an identifier column? */
export function looksLikeIdColumn(header: string, values: string[]): boolean {
  const h = headerKey(header);
  if (ID_HEADER_HINTS.test(h)) return true;
  const sample = values.filter((v) => v.trim() !== "").slice(0, 50);
  if (sample.length === 0) return false;
  const leadingZeroCount = sample.filter((v) => /^0[\d]+/.test(v.trim())).length;
  return leadingZeroCount >= Math.max(1, sample.length * 0.3);
}

/** Profile columns quickly for warnings (leading zeros, integers, empties). */
export function profileColumns(headers: string[], rows: string[][]) {
  return headers.map((header, index) => {
    let nonEmptyCount = 0;
    let hasLeadingZeros = false;
    let allIntegers = true;
    for (const row of rows) {
      const v = row[index] ?? "";
      const t = v.trim();
      if (t === "") continue;
      nonEmptyCount++;
      if (/^0[\d]+$/.test(t)) hasLeadingZeros = true;
      if (!/^[+-]?\d+$/.test(t)) allIntegers = false;
    }
    return { index, header, nonEmptyCount, hasLeadingZeros, allIntegers };
  });
}

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

/** Hard limits for the browser edition; documented openly in the UI. */
export const LIMITS = {
  /** Max bytes per uploaded file (100 MB). */
  MAX_FILE_BYTES: 100 * 1024 * 1024 as number,
  /** Max rows per table for compare/dedupe to stay responsive. */
  MAX_ROWS: 1_000_000,
  /** Max columns rendered in previews (data still loads if greater). */
  MAX_PREVIEW_COLUMNS: 30,
  /** Max preview rows shown in DOM (data itself is fully processed). */
  MAX_PREVIEW_ROWS: 200,
} as const;

export function validateTableSize(headers: string[], rows: string[][]): void {
  if (rows.length > LIMITS.MAX_ROWS) {
    throw new ValidationError("ROW_LIMIT", ERROR_MESSAGES.ROW_LIMIT, { limit: LIMITS.MAX_ROWS });
  }
  void headers;
}
