/**
 * Duplicate detection. Produces a *plan* (indices to keep/drop) — the caller
 * previews it and only applies it to a copy on explicit confirmation.
 */

import type { DedupePlan, DuplicateGroup, KeepRule, Table } from "./types.js";
import { makeKey } from "./normalize.js";

export interface DedupeOptions {
  /** Column indices that identify a duplicate; null = full-row mode. */
  keyColumns: number[] | null;
  /** Which record to keep within each duplicate group. */
  keepRule: KeepRule;
  /** Normalize keys: trim whitespace before matching. */
  trimKeys: boolean;
  /** Normalize keys: case-insensitive matching. */
  caseSensitive: boolean;
  /** Treat tokens like "N/A" as empty when matching keys. */
  emptyTokensEqual: boolean;
}

export const DEFAULT_DEDUPE_OPTIONS: DedupeOptions = {
  keyColumns: null,
  keepRule: "first",
  trimKeys: true,
  caseSensitive: false,
  emptyTokensEqual: false,
};

export function planDedupe(table: Table, options: DedupeOptions): DedupePlan {
  const keyOpts = {
    trim: options.trimKeys,
    caseSensitive: options.caseSensitive,
    emptyTokens: options.emptyTokensEqual ? ["", "n/a", "na", "null", "none"] : undefined,
  };

  const groupsByKey = new Map<string, number[]>();
  for (let i = 0; i < table.rows.length; i++) {
    const key = makeKey(table.rows[i], options.keyColumns, keyOpts);
    const bucket = groupsByKey.get(key);
    if (bucket) bucket.push(i);
    else groupsByKey.set(key, [i]);
  }

  const keepIndices: number[] = [];
  const dropIndices: number[] = [];
  const groups: DuplicateGroup[] = [];

  for (const [key, members] of groupsByKey) {
    if (members.length === 1) {
      keepIndices.push(members[0]);
      continue;
    }
    const keepIndex = pickKeep(table, members.map((i) => i), options.keepRule);
    groups.push({
      key: decodeKey(key, options),
      rowNumbers: members.map((i) => table.sourceRowNumbers[i]),
      keepIndex,
    });
    for (const i of members) {
      if (i === keepIndex) keepIndices.push(i);
      else dropIndices.push(i);
    }
  }

  keepIndices.sort((a, b) => a - b);
  dropIndices.sort((a, b) => a - b);
  groups.sort((a, b) => a.rowNumbers[0] - b.rowNumbers[0]);

  return {
    keepIndices,
    dropIndices,
    groups,
    keyColumns: options.keyColumns,
    totalRows: table.rows.length,
  };
}

function pickKeep(table: Table, members: number[], rule: KeepRule): number {
  if (rule === "first") return members[0];
  if (rule === "last") return members[members.length - 1];
  // longest = most data content across the row (approximation of "most complete")
  let best = members[0];
  let bestLen = -1;
  for (const i of members) {
    const len = table.rows[i].reduce((sum, c) => sum + c.trim().length, 0);
    if (len > bestLen) { bestLen = len; best = i; }
  }
  return best;
}

function decodeKey(key: string, options: DedupeOptions): string {
  void options;
  const parts = key.split("\u001f");
  return parts.join(", ");
}

/** Apply a dedupe plan to a copy of the table (never mutates the input). */
export function applyDedupe(table: Table, plan: DedupePlan): Table {
  const rows = plan.keepIndices.map((i) => table.rows[i]);
  const rowNumbers = plan.keepIndices.map((i) => table.sourceRowNumbers[i]);
  return { ...table, rows, sourceRowNumbers: rowNumbers };
}
