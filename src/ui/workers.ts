/**
 * Client-side bridge to the worker: typed request/response, one at a time.
 */

import TidyWorker from "../worker/worker.ts?worker";
import type {
  DelimiterOption,
  DedupePlanPayload,
  WorkerRequest,
  WorkerResponse,
  ReportMetaPayload,
} from "../worker/worker.js";
import type { Table } from "../core/types.js";
import type { DiffOptions } from "../core/diff.js";
import type { DedupeOptions } from "../core/dedupe.js";
import type { CleanOptions } from "../core/clean.js";
import type { CleanChange } from "../core/clean.js";

let activeWorker: Worker | null = null;
let nextId = 1;
const inflight = new Map<number, { resolve: (v: WorkerResponse) => void; reject: (e: Error) => void }>();

function ensureWorker(): Worker {
  if (!activeWorker) {
    activeWorker = new TidyWorker();
    activeWorker.addEventListener("message", (ev: MessageEvent<WorkerResponse>) => {
      const pending = inflight.get(ev.data.id);
      if (pending) {
        inflight.delete(ev.data.id);
        pending.resolve(ev.data);
      }
    });
    activeWorker.addEventListener("error", (ev) => {
      const error = new Error(ev.message || "Worker error");
      for (const [, p] of inflight) p.reject(error);
      inflight.clear();
    });
  }
  return activeWorker;
}

export function isWorkerBusy(): boolean {
  return inflight.size > 0;
}

export function post(req: WorkerRequest): Promise<WorkerResponse> {
  const worker = ensureWorker();
  const id = nextId++;
  const promise = new Promise<WorkerResponse>((resolve, reject) => {
    inflight.set(id, { resolve, reject });
  });
  (req as { id: number }).id = id;
  worker.postMessage(req);
  return promise;
}

/* High-level typed helpers ----------------------------------------- */

export async function workerParse(
  bytes: ArrayBuffer,
  name: string,
  delimiter: DelimiterOption
): Promise<{ table: Table | null; delimiterUsed?: string; code?: string; message?: string }> {
  const resp = await post({ kind: "parse", bytes, name, delimiter } as WorkerRequest);
  if (resp.ok && "table" in resp && "delimiterUsed" in resp) {
    const r = resp as { table: Table; delimiterUsed?: string };
    return { table: r.table, delimiterUsed: r.delimiterUsed };
  }
  if (resp.ok && "table" in resp) {
    const r = resp as { table: Table };
    return { table: r.table };
  }
  const e = resp as { code?: string; message?: string };
  return { table: null, code: e.code, message: e.message };
}

// Augment WorkerResponse with a kind marker by re-narrowing at runtime via
// the presence of fields. The casts below are safe because the worker only
// ever replies with one shape per request kind.

export async function workerDedupePlan(
  table: Table,
  options: Partial<DedupeOptions>
): Promise<DedupePlanPayload | { code: string; message: string }> {
  const resp = await post({ kind: "dedupe-plan", table, options } as WorkerRequest);
  if (resp.ok && "plan" in resp) return (resp as { plan: DedupePlanPayload }).plan;
  const e = resp as { code?: string; message?: string };
  return { code: e.code ?? "", message: e.message ?? "" };
}

export async function workerDedupeApply(table: Table, plan: DedupePlanPayload): Promise<Table> {
  const resp = await post({ kind: "dedupe-apply", table, plan } as WorkerRequest);
  if (resp.ok && "table" in resp) return (resp as { table: Table }).table;
  const e = resp as { message?: string };
  throw new Error(e.message ?? "dedupe-apply failed");
}

export async function workerClean(
  table: Table,
  options: Partial<CleanOptions>
): Promise<{ table: Table; changes?: CleanChange[]; totalChangedCells?: number }> {
  const resp = await post({ kind: "clean", table, options } as WorkerRequest);
  if (resp.ok && "table" in resp) {
    const r = resp as { table: Table; changes?: CleanChange[]; totalChangedCells?: number };
    return { table: r.table, changes: r.changes, totalChangedCells: r.totalChangedCells };
  }
  const e = resp as { message?: string };
  throw new Error(e.message ?? "clean failed");
}

export async function workerDiff(tableA: Table, tableB: Table, options: DiffOptions) {
  const resp = await post({ kind: "diff", tableA, tableB, options } as WorkerRequest);
  if (resp.ok && "diff" in resp) return (resp as { diff: ReturnType<typeof import("../core/diff.js").diffTables> }).diff;
  const e = resp as { message?: string };
  throw new Error(e.message ?? "diff failed");
}

export async function workerDiffReport(
  tableA: Table,
  tableB: Table,
  options: DiffOptions,
  meta: ReportMetaPayload
): Promise<string> {
  const resp = await post({ kind: "diff-report", tableA, tableB, options, meta } as WorkerRequest);
  if (resp.ok && "reportCsv" in resp) return (resp as { reportCsv: string }).reportCsv;
  const e = resp as { message?: string };
  throw new Error(e.message ?? "diff-report failed");
}

export async function workerDedupeRemovedCsv(table: Table, dropIndices: number[]): Promise<string> {
  const resp = await post({ kind: "dedupe-removed-csv", table, dropIndices } as WorkerRequest);
  if (resp.ok && "reportCsv" in resp) return (resp as { reportCsv: string }).reportCsv;
  const e = resp as { message?: string };
  throw new Error(e.message ?? "dedupe-removed-csv failed");
}

export async function workerTableCsv(table: Table): Promise<string> {
  const resp = await post({ kind: "table-csv", table } as WorkerRequest);
  if (resp.ok && "reportCsv" in resp) return (resp as { reportCsv: string }).reportCsv;
  const e = resp as { message?: string };
  throw new Error(e.message ?? "table-csv failed");
}
