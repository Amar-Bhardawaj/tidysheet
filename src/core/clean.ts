/**
 * Text cleaning — deliberately conservative. Cleaning only rewrites text the
 * user explicitly asked for; identifier-like columns can always be excluded.
 * Values are compared as strings; numbers/dates are never re-parsed.
 */

import type { CompareOptions, Table } from "./types.js";
import { DEFAULT_EMPTY_TOKENS } from "./types.js";
import { tidyText } from "./normalize.js";

export interface CleanOptions {
  /** Remove leading/trailing whitespace. */
  trimEdges: boolean;
  /** Collapse internal whitespace runs to one space (like Excel's TRIM). */
  collapseWhitespace: boolean;
  /** Values (case-insensitive) that should be considered empty. */
  emptyTokens: string[];
  /** Headers protected from any cleaning. */
  excludedColumns: string[];
}

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  trimEdges: true,
  collapseWhitespace: false,
  emptyTokens: [],
  excludedColumns: [],
};

export interface CleanChange {
  column: number;
  header: string;
  changedCells: number;
  examples: Array<{ row: number; before: string; after: string }>;
}

export interface CleanResult {
  table: Table;
  changes: CleanChange[];
  totalChangedCells: number;
}

/** Apply one clean step to a single cell. Column-independent. */
export function cleanCell(value: string, opts: CleanOptions): string {
  let v = value;
  if (opts.trimEdges) v = v.trim();
  if (opts.collapseWhitespace) v = v.replace(/[^\S\r\n]+/g, " ").trim();
  const lower = v.toLowerCase();
  if (opts.emptyTokens.length > 0 && opts.emptyTokens.includes(lower)) return "";
  return v;
}

/** Clean a whole table. Returns the new table plus per-column change stats. */
export function cleanTable(input: Table, options: CleanOptions): CleanResult {
  const excluded = new Set(options.excludedColumns.map((h) => h.trim().toLowerCase()));
  const columns = input.headers.map((h, i) => ({ h, i, active: !excluded.has(h.trim().toLowerCase()) }));
  if (!columns.some((c) => c.active)) {
    return { table: cloneShallow(input), changes: [], totalChangedCells: 0 };
  }

  const tokens = options.emptyTokens.map((t) => t.trim().toLowerCase());
  const localOpts: CleanOptions = { ...options, emptyTokens: tokens };

  const rows: string[][] = new Array(input.rows.length);
  const changes: CleanChange[] = [];
  let total = 0;

  for (const col of columns) {
    if (!col.active) continue;
    const change: CleanChange = { column: col.i, header: col.h, changedCells: 0, examples: [] };
    for (let r = 0; r < input.rows.length; r++) {
      const before = input.rows[r][col.i] ?? "";
      const after = cleanCell(before, localOpts);
      if (after !== before) {
        change.changedCells++;
        if (change.examples.length < 3) change.examples.push({ row: input.sourceRowNumbers[r], before, after });
        if (change.examples.length >= 3) { /* keep at most 3 */ }
      }
    }
    if (change.changedCells > 0) { changes.push(change); total += change.changedCells; }
  }

  // Second pass builds cleaned rows (column loops already cost the comparisons).
  for (let r = 0; r < input.rows.length; r++) {
    const row = input.rows[r];
    const out: string[] = new Array(row.length);
    for (let c = 0; c < row.length; c++) {
      if (!columns[c]?.active) { out[c] = row[c] ?? ""; continue; }
      out[c] = cleanCell(row[c] ?? "", localOpts);
    }
    rows[r] = out;
  }

  return {
    table: { ...input, rows },
    changes,
    totalChangedCells: total,
  };
}

function cloneShallow(t: Table): Table {
  return { ...t, rows: t.rows.slice() };
}

/** Compare two cells under the given options; returns true when "equal enough". */
export function cellsEqual(
  a: string,
  b: string,
  opts: CompareOptions,
  emptyTokens: string[] = DEFAULT_EMPTY_TOKENS
): boolean {
  let x = a;
  let y = b;
  if (opts.trimCells) { x = x.trim(); y = y.trim(); }
  if (opts.emptyTokensEqual) {
    const nx = normalizeEmpty(x, emptyTokens);
    const ny = normalizeEmpty(y, emptyTokens);
    if (!opts.caseSensitive) return nx.toLowerCase() === ny.toLowerCase();
    return nx === ny;
  }
  if (!opts.caseSensitive) return x.toLowerCase() === y.toLowerCase();
  return x === y;
}

function normalizeEmpty(v: string, tokens: string[]): string {
  const lower = v.toLowerCase();
  return tokens.includes(lower) ? "" : v;
}

/** Convenience: exact-blank test used for "missing values" reporting. */
export function isMissing(v: string): boolean {
  return tidyText(v, false) === "";
}
