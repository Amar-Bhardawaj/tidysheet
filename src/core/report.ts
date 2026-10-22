/**
 * Change-report builder. Produces a self-contained CSV the user can hand to
 * a colleague: header block, counts, then one row per added/removed/changed
 * record with per-cell before/after detail (kept readable by quoting).
 */

import type { DiffResult, Table } from "./types.js";
import { toCsv } from "../format/csv-write.js";

export interface ReportMeta {
  fileA?: string;
  fileB?: string;
  keyColumnsA: string[];
  keyColumnsB: string[];
  /** ISO timestamp string, injected by caller for testability. */
  generatedAt: string;
  toolName: string;
}

export function buildDiffReport(ta: Table, tb: Table, result: DiffResult, meta: ReportMeta): string {
  const rows: string[][] = [];
  const q = (v: string) => (v.length > 200 ? v.slice(0, 197) + "…" : v);

  rows.push(["TidySheet change report"]);
  rows.push(["Generated", meta.generatedAt]);
  rows.push(["File A", meta.fileA ?? "file A"]);
  rows.push(["File B", meta.fileB ?? "file B"]);
  rows.push(["Key columns (A)", meta.keyColumnsA.join(", ")]);
  rows.push(["Key columns (B)", meta.keyColumnsB.join(", ")]);
  rows.push(["Rows in A", String(ta.rows.length)]);
  rows.push(["Rows in B", String(tb.rows.length)]);
  rows.push(["Added (in B only)", String(result.added.length)]);
  rows.push(["Removed (in A only)", String(result.removed.length)]);
  rows.push(["Changed", String(result.changed.length)]);
  rows.push(["Unchanged", String(result.unchangedCount)]);
  rows.push(["Duplicate keys in A", String(result.duplicateKeysA.length)]);
  rows.push(["Duplicate keys in B", String(result.duplicateKeysB.length)]);
  rows.push([]);

  if (result.duplicateKeysA.length > 0) {
    rows.push(["WARNING duplicate keys in file A"]);
    for (const dup of result.duplicateKeysA) {
      rows.push(["key", uniqKeyOf(dup.key), "rows", dup.rowNumbers.map(String).join(", ")]);
    }
    rows.push(["Note: rows with a duplicated key were paired in file order; check these lines manually."]);
    rows.push([]);
  }
  if (result.duplicateKeysB.length > 0) {
    rows.push(["WARNING duplicate keys in file B"]);
    for (const dup of result.duplicateKeysB) {
      rows.push(["key", uniqKeyOf(dup.key), "rows", dup.rowNumbers.map(String).join(", ")]);
    }
    rows.push(["Note: rows with a duplicated key were paired in file order; check these lines manually."]);
    rows.push([]);
  }

  rows.push(["Status", "Key", "Row in A", "Row in B", "Changed columns", "Detail"]);
  for (const c of result.changed) {
    const detail = c.cells
      .map((cell) => `${cell.header}: ${q(cell.valueA)} → ${q(cell.valueB)}`)
      .join(" | ");
    rows.push([
      "changed",
      c.key ?? "",
      String(c.rowNumberA),
      String(c.rowNumberB),
      String(c.cells.length),
      detail,
    ]);
  }
  for (const r of result.added) {
    rows.push([
      r.viaDuplicatePairing ? "added (duplicate partner)" : "added",
      r.key ?? "",
      "",
      String(r.rowNumberB),
      "",
      "",
    ]);
  }
  for (const r of result.removed) {
    rows.push([
      r.viaDuplicatePairing ? "removed (duplicate partner)" : "removed",
      r.key ?? "",
      String(r.rowNumberA),
      "",
      "",
      "",
    ]);
  }
  return toCsv([], rows, { bom: true });
}

/** Duplicate key entries produced by the engine are normalized strings; show a readable label. */
function uniqKeyOf(normalized: string): string {
  return normalized.replace(/\u001f/g, " + ");
}

/** CSV rows to export the *removed* records from a dedupe (order + full values). */
export function removedRowsCsv(table: Table, dropIndices: number[]): string {
  const rows = dropIndices
    .sort((a, b) => a - b)
    .map((i) => [String(table.sourceRowNumbers[i]), ...table.rows[i]]);
  return toCsv(["Source row", ...table.headers], rows, { bom: true });
}
