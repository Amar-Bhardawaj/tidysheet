/**
 * Web worker: runs parse/dedupe/diff/clean off the UI thread so large files
 * never freeze the page. All payloads are structured-clone-safe plain data.
 */

import { parseTableFromBytes } from "../format/csv.js";
import { planDedupe, applyDedupe, DEFAULT_DEDUPE_OPTIONS } from "../core/dedupe.js";
import type { DedupeOptions } from "../core/dedupe.js";
import type { CleanChange } from "../core/clean.js";
import { cleanTable, DEFAULT_CLEAN_OPTIONS } from "../core/clean.js";
import type { CleanOptions } from "../core/clean.js";
import { diffTables } from "../core/diff.js";
import type { DiffOptions } from "../core/diff.js";
import type { Table } from "../core/types.js";
import { formatError } from "../core/errors.js";
import { buildDiffReport, removedRowsCsv } from "../core/report.js";
import { toCsv } from "../format/csv-write.js";

export type WorkerRequest =
  | { id: number; kind: "parse"; bytes: ArrayBuffer; name: string; delimiter: DelimiterOption }
  | { id: number; kind: "dedupe-plan"; table: Table; options: Partial<DedupeOptions> }
  | { id: number; kind: "dedupe-apply"; table: Table; plan: DedupePlanPayload }
  | { id: number; kind: "clean"; table: Table; options: Partial<CleanOptions> }
  | { id: number; kind: "diff"; tableA: Table; tableB: Table; options: DiffOptions }
  | { id: number; kind: "diff-report"; tableA: Table; tableB: Table; options: DiffOptions; meta: ReportMetaPayload }
  | { id: number; kind: "dedupe-removed-csv"; table: Table; dropIndices: number[] }
  | { id: number; kind: "table-csv"; table: Table };

export type DelimiterOption = "," | ";" | "\t" | "|" | "auto";
export type DedupePlanPayload = ReturnType<typeof planDedupe>;
export type ReportMetaPayload = {
  fileA?: string;
  fileB?: string;
  keyColumnsA: string[];
  keyColumnsB: string[];
  generatedAt: string;
  toolName: string;
};

export type WorkerResponse =
  | { id: number; ok: true; table: Table; delimiterUsed?: string }
  | { id: number; ok: true; plan: DedupePlanPayload }
  | { id: number; ok: true; table: Table; changes?: CleanChange[]; totalChangedCells?: number }
  | { id: number; ok: true; diff: DiffOutput }
  | { id: number; ok: true; reportCsv: string }
  | { id: number; ok: false; code: string; message: string };

export type DiffOutput = ReturnType<typeof diffTables>;

self.addEventListener("message", (ev: MessageEvent<WorkerRequest>) => {
  const req = ev.data;
  try {
    switch (req.kind) {
      case "parse": {
        const table = parseTableFromBytes(new Uint8Array(req.bytes), {
          delimiter: req.delimiter,
          sourceName: req.name,
        });
        post({ id: req.id, ok: true, table, delimiterUsed: table.delimiter });
        break;
      }
      case "dedupe-plan": {
        const options = { ...DEFAULT_DEDUPE_OPTIONS, ...req.options };
        post({ id: req.id, ok: true, plan: planDedupe(req.table, options) });
        break;
      }
      case "dedupe-apply": {
        const table = applyDedupe(req.table, req.plan);
        post({ id: req.id, ok: true, table });
        break;
      }
      case "clean": {
        const options = { ...DEFAULT_CLEAN_OPTIONS, ...req.options };
        const result = cleanTable(req.table, options);
        post({ id: req.id, ok: true, table: result.table, changes: result.changes, totalChangedCells: result.totalChangedCells });
        break;
      }
      case "diff": {
        const diff = diffTables(req.tableA, req.tableB, req.options);
        post({ id: req.id, ok: true, diff });
        break;
      }
      case "diff-report": {
        const diff = diffTables(req.tableA, req.tableB, req.options);
        const csv = buildDiffReport(req.tableA, req.tableB, diff, req.meta);
        post({ id: req.id, ok: true, reportCsv: csv });
        break;
      }
      case "dedupe-removed-csv": {
        const csv = removedRowsCsv(req.table, req.dropIndices);
        post({ id: req.id, ok: true, reportCsv: csv });
        break;
      }
      case "table-csv": {
        const csv = toCsv(req.table.headers, req.table.rows, { bom: true });
        post({ id: req.id, ok: true, reportCsv: csv });
        break;
      }
      default: {
        post({ id: (req as { id: number }).id, ok: false, code: "BAD_INPUT", message: "Unknown worker request." });
      }
    }
  } catch (err) {
    const { code, message } = formatError(err);
    post({ id: req.id, ok: false, code, message });
  }
});

function post(resp: WorkerResponse): void {
  (self as unknown as Worker).postMessage(resp);
}
