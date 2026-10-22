/**
 * Application controller for the single-page flow. Owns state, wires the
 * worker results into the preview/confirm panels, and keeps the UI honest
 * about processing state.
 */

import { el, clear, downloadText } from "./components.js";
import { createUploadZone, fileStatusCard } from "./uploadZone.js";
import { createOptionPanel } from "./optionPanel.js";
import { renderPreview } from "./previewTable.js";
import { createConfirmPanel } from "./confirmPanel.js";
import {
  workerParse,
  workerDedupePlan,
  workerDedupeApply,
  workerDedupeRemovedCsv,
  workerClean,
  workerDiff,
  workerDiffReport,
  workerTableCsv,
} from "./workers.js";
import type { Table } from "../core/types.js";
import type { DedupePlanPayload } from "../worker/worker.js";
import type { DedupeSettings, CleanSettings, DiffSettings, Mode } from "./optionPanel.js";
import { LIMITS } from "../core/normalize.js";

export interface AppOptions {
  root: HTMLElement;
}

export function mountApp(root: HTMLElement): void {
  const state: {
    tableA: Table | null;
    tableB: Table | null;
    mode: Mode;
    dedupeSettings: DedupeSettings | null;
    cleanSettings: CleanSettings | null;
    diffSettings: DiffSettings | null;
    dedupePlan: DedupePlanPayload | null;
    cleanTable: Table | null;
    cleanChanges: { column: number; header: string; changedCells: number; examples: { row: number; before: string; after: string }[] }[] | null;
    diffResult: ReturnType<typeof import("../core/diff.js").diffTables> | null;
    lastDiffReportCsv: string | null;
    lastDedupeRemovedCsv: string | null;
    lastCleanedCsv: string | null;
    lastDedupedCsv: string | null;
    busy: boolean;
  } = {
    tableA: null,
    tableB: null,
    mode: "single",
    dedupeSettings: null,
    cleanSettings: null,
    diffSettings: null,
    dedupePlan: null,
    cleanTable: null,
    cleanChanges: null,
    diffResult: null,
    lastDiffReportCsv: null,
    lastDedupeRemovedCsv: null,
    lastCleanedCsv: null,
    lastDedupedCsv: null,
    busy: false,
  };

  const statusLine = el("p", { id: "status-line", class: "status-line", text: "Ready — drop a file to begin." });
  const errorBox = el("div", { id: "error-box", class: "error-box" });
  errorBox.hidden = true;
  const uploadZone = createUploadZone({
    onFiles: (files) => {
      void handleFiles(files);
    },
  });
  const statusCards = el("div", { id: "status-cards", class: "status-cards" });
  const optionPanel = createOptionPanel({
    onMode: (m) => { state.mode = m; },
    onDedupe: (s) => { state.dedupeSettings = s; },
    onClean: (s) => { state.cleanSettings = s; },
    onDiff: (s) => { state.diffSettings = s; },
    onRunDedupe: () => { void runDedupe(); },
    onRunClean: () => { void runClean(); },
    onRunDiff: () => { void runDiff(); },
  });
  const previewContainer = el("div", { id: "preview", class: "preview-container" });
  const confirmPanel = createConfirmPanel({
    onConfirm: () => { void applyDedupe(); },
    onCancel: () => {
      (confirmPanel as HTMLElement & { hide?: () => void }).hide?.();
    },
    onDownload: (label) => { void handleDownload(label); },
  });

  root.appendChild(el("header", { class: "hero" },
    el("h1", { text: "TidySheet" }),
    el("p", { class: "hero-sub", text: "Clean, dedupe and compare CSV/TSV exports — on your computer, in this tab. Nothing is uploaded." })
  ));
  root.appendChild(errorBox);
  root.appendChild(statusLine);
  root.appendChild(uploadZone);
  root.appendChild(statusCards);
  root.appendChild(optionPanel);
  root.appendChild(previewContainer);
  root.appendChild(confirmPanel);
  root.appendChild(el("footer", { class: "footer" },
    el("p", { text: "Privacy: files are processed entirely in this browser tab. No file content is sent anywhere. Closing the tab discards everything." }),
    el("p", { text: "v1 supports CSV and TSV (Excel .xlsx support is planned next). Files above 100 MB cannot be loaded in a browser." })
  ));

  function setStatus(text: string): void {
    statusLine.textContent = text;
  }
  function showError(message: string): void {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }
  function clearError(): void {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }
  function setBusy(busy: boolean): void {
    state.busy = busy;
    setStatus(busy ? "Working…" : "Ready.");
  }

  async function handleFiles(files: File[]): Promise<void> {
    clearError();
    clear(statusCards);
    state.tableA = null;
    state.tableB = null;
    state.dedupePlan = null;
    state.cleanTable = null;
    state.diffResult = null;
    (confirmPanel as HTMLElement & { hide?: () => void }).hide?.();
    clear(previewContainer);

    const valid = files.filter((f) => f.size > 0);
    if (valid.length === 0) {
      showError("Those files appear to be empty.");
      return;
    }
    if (valid.length > 2) {
      showError("Please drop one or two files at a time.");
      return;
    }
    for (const f of valid) {
      if (f.size > LIMITS.MAX_FILE_BYTES) {
        showError(`${f.name} is larger than ${Math.round(LIMITS.MAX_FILE_BYTES / (1024 * 1024))} MB. Please split it first.`);
        return;
      }
    }

    setBusy(true);
    try {
      const parsed: Table[] = [];
      for (const f of valid) {
        const bytes = await f.arrayBuffer();
        const result = await workerParse(bytes, f.name, "auto");
        if (!result.table) {
          showError(result.message ?? "Could not read that file.");
          setBusy(false);
          return;
        }
        parsed.push(result.table);
        statusCards.appendChild(
          fileStatusCard(f.name, f.size, `${result.table.rows.length} data rows · ${result.table.headers.length} columns${result.delimiterUsed ? ` · separator “${result.delimiterUsed}”` : ""}`)
        );
        if (result.table.notices.length > 0) {
          for (const n of result.table.notices) {
            statusCards.appendChild(el("p", { class: "notice", text: n }));
          }
        }
      }
      state.tableA = parsed[0] ?? null;
      state.tableB = parsed[1] ?? null;

      const optPanel = optionPanel as HTMLElement & { populateColumns?: (t: Table | null, isDiff: boolean) => void };
      optPanel.populateColumns?.(state.tableA, false);
      setStatus(state.tableB ? "Two files loaded — switch to “Two files: compare / diff” to compare them." : "File loaded — choose an operation above.");
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runDedupe(): Promise<void> {
    if (!state.tableA || !state.dedupeSettings) return;
    clearError();
    setBusy(true);
    try {
      const plan = await workerDedupePlan(state.tableA, state.dedupeSettings);
      if ("code" in plan && "message" in plan && !("keepIndices" in plan)) {
        showError((plan as { message: string }).message);
        return;
      }
      state.dedupePlan = plan as DedupePlanPayload;
      const p = state.dedupePlan;
      const previewRows = state.tableA.rows.map((row, i) => ({
        status: (p.dropIndices.includes(i) ? "duplicate" : "unchanged") as "duplicate" | "unchanged",
        cells: row,
        rowNumber: state.tableA!.sourceRowNumbers[i],
      }));
      renderPreview(previewContainer, state.tableA.headers.map((h, i) => ({ header: h, index: i })), previewRows, {
        totalShown: p.dropIndices.length,
        totalRows: state.tableA.rows.length,
        hint: `${p.dropIndices.length} row${p.dropIndices.length === 1 ? "" : "s"} will be removed; ${p.keepIndices.length} will be kept. Click “Confirm and apply” to download the cleaned file.`,
      });
      const confirm = confirmPanel as HTMLElement & { show?: (m: string, d: { label: string; fileName: string }[]) => void };
      confirm.show?.(
        `Remove ${p.dropIndices.length} duplicate row${p.dropIndices.length === 1 ? "" : "s"}? ${p.keepIndices.length} rows will remain. This only affects the downloaded file — your original is untouched.`,
        [{ label: "Download cleaned file", fileName: "tidysheet-deduped.csv" }]
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function applyDedupe(): Promise<void> {
    if (!state.tableA || !state.dedupePlan) return;
    clearError();
    setBusy(true);
    try {
      const deduped = await workerDedupeApply(state.tableA, state.dedupePlan);
      state.lastDedupedCsv = await workerTableCsv(deduped);
      state.lastDedupeRemovedCsv = await workerDedupeRemovedCsv(state.tableA, state.dedupePlan.dropIndices);
      downloadText("tidysheet-deduped.csv", state.lastDedupedCsv);
      setStatus(`Downloaded tidysheet-deduped.csv (${deduped.rows.length} rows). Removed-rows report also available.`);
      (confirmPanel as HTMLElement & { hide?: () => void }).hide?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runClean(): Promise<void> {
    if (!state.tableA || !state.cleanSettings) return;
    clearError();
    setBusy(true);
    try {
      const result = await workerClean(state.tableA, state.cleanSettings.options);
      state.cleanTable = result.table;
      state.cleanChanges = result.changes ?? null;
      state.lastCleanedCsv = await workerTableCsv(result.table);
      const changedCells = result.totalChangedCells ?? 0;
      const previewRows = result.table.rows.map((row, i) => ({
        status: changedCells > 0 ? ("cleaned" as const) : ("unchanged" as const),
        cells: row,
        rowNumber: result.table.sourceRowNumbers[i],
      }));
      renderPreview(previewContainer, result.table.headers.map((h, i) => ({ header: h, index: i })), previewRows, {
        totalShown: result.table.rows.length,
        totalRows: result.table.rows.length,
        hint: changedCells === 0 ? "No cells changed under those settings." : `${changedCells} cell${changedCells === 1 ? "" : "s"} changed across ${result.changes?.length ?? 0} column${(result.changes?.length ?? 0) === 1 ? "" : "s"}. Download to keep the result.`,
      });
      const confirm = confirmPanel as HTMLElement & { show?: (m: string, d: { label: string; fileName: string }[]) => void };
      confirm.show?.(
        changedCells === 0
          ? "No cells changed under those settings. You can still download the file as-is."
          : `${changedCells} cell${changedCells === 1 ? "" : "s"} changed. Download the cleaned file?`,
        [{ label: "Download cleaned file", fileName: "tidysheet-cleaned.csv" }]
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runDiff(): Promise<void> {
    if (!state.tableA || !state.tableB || !state.diffSettings) return;
    clearError();
    setBusy(true);
    try {
      const diff = await workerDiff(state.tableA, state.tableB, state.diffSettings);
      state.diffResult = diff;
      const allRows: { status: "added" | "removed" | "changed" | "unchanged"; cells: string[]; rowNumber?: number; rowNumberB?: number }[] = [];
      for (const r of diff.changed) {
        const cells = state.tableA.rows[r.rowA].slice();
        allRows.push({ status: "changed", cells, rowNumber: r.rowNumberA, rowNumberB: r.rowNumberB });
      }
      for (const r of diff.removed) {
        const cells = state.tableA.rows[r.rowA].slice();
        allRows.push({ status: "removed", cells, rowNumber: r.rowNumberA });
      }
      for (const r of diff.added) {
        const cells = state.tableB.rows[r.rowB].slice();
        allRows.push({ status: "added", cells, rowNumberB: r.rowNumberB });
      }
      renderPreview(previewContainer, state.tableA.headers.map((h, i) => ({ header: h, index: i })), allRows, {
        totalShown: allRows.length,
        totalRows: allRows.length,
        hint: `${diff.added.length} added, ${diff.removed.length} removed, ${diff.changed.length} changed, ${diff.unchangedCount} unchanged. ${diff.duplicateKeysA.length + diff.duplicateKeysB.length} duplicate-key warning(s).`,
      });
      if (diff.duplicateKeysA.length > 0 || diff.duplicateKeysB.length > 0) {
        const w = el("div", { class: "warning-box" });
        w.appendChild(el("p", { class: "warning-title", text: "Duplicate key warning" }));
        for (const d of diff.duplicateKeysA) {
          w.appendChild(el("p", { text: `File A: key “${d.key}” appeared in rows ${d.rowNumbers.join(", ")}. Rows were paired in file order — please verify.` }));
        }
        for (const d of diff.duplicateKeysB) {
          w.appendChild(el("p", { text: `File B: key “${d.key}” appeared in rows ${d.rowNumbers.join(", ")}. Rows were paired in file order — please verify.` }));
        }
        previewContainer.appendChild(w);
      }
      const confirm = confirmPanel as HTMLElement & { show?: (m: string, d: { label: string; fileName: string }[]) => void };
      confirm.show?.(
        `Comparison complete: ${diff.added.length} added, ${diff.removed.length} removed, ${diff.changed.length} changed, ${diff.unchangedCount} unchanged.`,
        [{ label: "Download change report", fileName: "tidysheet-diff-report.csv" }]
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(label: string): Promise<void> {
    try {
      if (label === "Download cleaned file" && state.cleanTable) {
        if (!state.lastCleanedCsv) state.lastCleanedCsv = await workerTableCsv(state.cleanTable);
        downloadText("tidysheet-cleaned.csv", state.lastCleanedCsv);
      } else if (label === "Download cleaned file" && state.dedupePlan && state.tableA) {
        if (!state.lastDedupedCsv) {
          const t = await workerDedupeApply(state.tableA, state.dedupePlan);
          state.lastDedupedCsv = await workerTableCsv(t);
        }
        downloadText("tidysheet-deduped.csv", state.lastDedupedCsv);
      } else if (label === "Download change report" && state.tableA && state.tableB && state.diffSettings) {
        if (!state.lastDiffReportCsv) {
          state.lastDiffReportCsv = await workerDiffReport(state.tableA, state.tableB, state.diffSettings, {
            fileA: state.tableA.sourceName,
            fileB: state.tableB.sourceName,
            keyColumnsA: state.diffSettings.keyColumnsA.map((i) => state.tableA!.headers[i]),
            keyColumnsB: state.diffSettings.keyColumnsB.map((i) => state.tableB!.headers[i]),
            generatedAt: new Date().toISOString(),
            toolName: "TidySheet",
          });
        }
        downloadText("tidysheet-diff-report.csv", state.lastDiffReportCsv);
      } else if (label === "Download cleaned file") {
        // fallback: no-op
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : String(err));
    }
  }
}
