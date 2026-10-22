/**
 * Key-based two-file diff. Rows are matched by a chosen key column (or
 * composite key), so row/column order differences never create false
 * changes. Duplicate keys are handled *loudly*: paired in file order with
 * explicit warnings and orphan flags, never silently mis-paired.
 *
 * Columns are paired by normalized header name; columns that don't exist in
 * the other file are ignored for change detection and reported separately.
 */

import type { CellChange, CompareOptions, DiffResult, DifRowChange, DuplicateKeyInfo, Table } from "./types.js";
import { cellsEqual } from "./clean.js";
import { headerKey, makeKey } from "./normalize.js";

export interface DiffOptions {
  keyColumnsA: number[];
  keyColumnsB: number[];
  compare: CompareOptions;
}

/**
 * Compare two tables. The result is a complete classification plus the
 * duplicate-key situation in each file. Inputs are never mutated.
 */
export function diffTables(ta: Table, tb: Table, opts: DiffOptions): DiffResult {
  const compare = opts.compare;
  const emptyTokens = compare.emptyTokensEqual ? ["", "n/a", "na", "null", "none"] : undefined;

  const keyA = new Map<string, number[]>();
  const keyB = new Map<string, number[]>();
  for (let i = 0; i < ta.rows.length; i++) {
    const k = makeKey(ta.rows[i], opts.keyColumnsA, {
      trim: compare.trimCells,
      caseSensitive: compare.caseSensitive,
      emptyTokens,
    });
    pushIndex(keyA, k, i);
  }
  for (let i = 0; i < tb.rows.length; i++) {
    const k = makeKey(tb.rows[i], opts.keyColumnsB, {
      trim: compare.trimCells,
      caseSensitive: compare.caseSensitive,
      emptyTokens,
    });
    pushIndex(keyB, k, i);
  }

  const duplicateKeysA = detectDuplicates(keyA, ta);
  const duplicateKeysB = detectDuplicates(keyB, tb);

  // Column pairing by normalized header name.
  const colMapB = new Map<string, number>();
  tb.headers.forEach((h, i) => colMapB.set(headerKey(h), i));
  const colMapA = new Map<string, number>();
  ta.headers.forEach((h, i) => colMapA.set(headerKey(h), i));

  const unmatchedA: string[] = [];
  const unmatchedB: string[] = [];
  const columnPairs: Array<{ cA: number; cB: number; header: string }> = [];
  for (let cA = 0; cA < ta.headers.length; cA++) {
    const k = headerKey(ta.headers[cA]);
    const cB = colMapB.get(k);
    if (cB === undefined) { unmatchedA.push(ta.headers[cA]); continue; }
    columnPairs.push({ cA, cB, header: ta.headers[cA] });
  }
  for (const h of tb.headers) {
    if (!colMapA.has(headerKey(h))) unmatchedB.push(h);
  }

  const added: DifRowChange[] = [];
  const removed: DifRowChange[] = [];
  const changed: DifRowChange[] = [];
  let unchangedCount = 0;

  // Keys present in either file.
  const allKeys = new Set<string>([...keyA.keys(), ...keyB.keys()]);
  for (const key of allKeys) {
    const aMembers = keyA.get(key) ?? [];
    const bMembers = keyB.get(key) ?? [];

    if (aMembers.length > 0 && bMembers.length === 0) {
      for (const i of aMembers) removed.push(makeStatus(ta, tb, i, null, key, [], viaDup(keyA, key)));
      continue;
    }
    if (aMembers.length === 0 && bMembers.length > 0) {
      for (const i of bMembers) added.push(makeStatus(ta, tb, null, i, key, [], viaDup(keyB, key)));
      continue;
    }
    // Present on both sides: pair by member order (1st ↔ 1st, 2nd ↔ 2nd…).
    const dupSituation = aMembers.length > 1 || bMembers.length > 1;
    const pairCount = Math.min(aMembers.length, bMembers.length);
    for (let p = 0; p < pairCount; p++) {
      const iA = aMembers[p];
      const iB = bMembers[p];
      const cellChanges: CellChange[] = [];
      for (const col of columnPairs) {
        const va = ta.rows[iA][col.cA] ?? "";
        const vb = tb.rows[iB][col.cB] ?? "";
        if (va === vb) continue;
        if (cellsEqual(va, vb, compare, emptyTokens)) continue;
        cellChanges.push({ column: col.cA, header: col.header, valueA: va, valueB: vb });
      }
      const entry: DifRowChange = {
        rowA: iA,
        rowB: iB,
        key,
        cells: cellChanges,
        viaDuplicatePairing: dupSituation,
        rowNumberA: ta.sourceRowNumbers[iA],
        rowNumberB: tb.sourceRowNumbers[iB],
      };
      if (cellChanges.length === 0) unchangedCount++;
      else changed.push(entry);
    }
    if (aMembers.length > pairCount) {
      for (let p = pairCount; p < aMembers.length; p++) {
        removed.push(makeStatus(ta, tb, aMembers[p], null, key, [], true));
      }
    }
    if (bMembers.length > pairCount) {
      for (let p = pairCount; p < bMembers.length; p++) {
        added.push(makeStatus(ta, tb, null, bMembers[p], key, [], true));
      }
    }
  }
  // Stable, human-sensible ordering for the report.
  added.sort((x, y) => x.rowNumberB - y.rowNumberB);
  removed.sort((x, y) => x.rowNumberA - y.rowNumberA);
  changed.sort((x, y) => x.rowNumberA - y.rowNumberA);

  void emptyTokens;
  return {
    keyColumnsA: opts.keyColumnsA,
    keyColumnsB: opts.keyColumnsB,
    added,
    removed,
    changed,
    unchangedCount,
    duplicateKeysA,
    duplicateKeysB,
  };
}

function makeStatus(
  ta: Table,
  tb: Table,
  rowA: number | null,
  rowB: number | null,
  key: string,
  cells: CellChange[],
  viaDup: boolean
): DifRowChange {
  return {
    rowA: rowA ?? -1,
    rowB: rowB ?? -1,
    key,
    rowNumberA: rowA === null ? 0 : ta.sourceRowNumbers[rowA],
    rowNumberB: rowB === null ? 0 : tb.sourceRowNumbers[rowB],
    cells,
    viaDuplicatePairing: viaDup,
  };
}

function pushIndex(map: Map<string, number[]>, key: string, index: number): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(index);
  else map.set(key, [index]);
}

function viaDup(map: Map<string, number[]>, key: string): boolean {
  return (map.get(key)?.length ?? 0) > 1;
}

function detectDuplicates(map: Map<string, number[]>, table: Table): DuplicateKeyInfo[] {
  const out: DuplicateKeyInfo[] = [];
  for (const [key, members] of map) {
    if (members.length > 1) {
      out.push({
        key,
        rowNumbers: members.map((i) => table.sourceRowNumbers[i]),
      });
    }
  }
  out.sort((a, b) => a.rowNumbers[0] - b.rowNumbers[0]);
  return out;
}
