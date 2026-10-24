/**
 * Option panel: mode + settings. Pure DOM; emits a settings object via onChange.
 */

import { el, clear } from "./components.js";
import type { Table } from "../core/types.js";
import type { CleanOptions } from "../core/clean.js";
import type { CompareOptions } from "../core/types.js";

export interface DiffSettings {
  keyColumnsA: number[];
  keyColumnsB: number[];
  compare: CompareOptions;
}

export interface DedupeSettings {
  keyColumns: number[] | null;
  keepRule: "first" | "last" | "longest";
  trimKeys: boolean;
  caseSensitive: boolean;
  emptyTokensEqual: boolean;
}

export interface CleanSettings {
  options: CleanOptions;
}

export type Mode = "single" | "diff";

export interface OptionCallbacks {
  onMode: (m: Mode) => void;
  onDedupe: (s: DedupeSettings) => void;
  onClean: (s: CleanSettings) => void;
  onDiff: (s: DiffSettings) => void;
  onRunDedupe: () => void;
  onRunClean: () => void;
  onRunDiff: () => void;
}

export function createOptionPanel(cb: OptionCallbacks): HTMLElement {
  const root = el("div", { class: "option-panel" });
  root.appendChild(el("h2", { text: "What do you want to do?" }));

  const modeRow = el("div", { class: "mode-row" });
  const singleBtn = el("button", { class: "chip is-active", text: "One file: clean or dedupe", type: "button" });
  singleBtn.setAttribute("aria-pressed", "true");
  const diffBtn = el("button", { class: "chip", text: "Two files: compare / diff", type: "button" });
  diffBtn.setAttribute("aria-pressed", "false");
  singleBtn.addEventListener("click", () => {
    singleBtn.classList.add("is-active");
    diffBtn.classList.remove("is-active");
    singleBtn.setAttribute("aria-pressed", "true");
    diffBtn.setAttribute("aria-pressed", "false");
    singleSection.hidden = false;
    diffSection.hidden = true;
    cb.onMode("single");
  });
  diffBtn.addEventListener("click", () => {
    diffBtn.classList.add("is-active");
    singleBtn.classList.remove("is-active");
    diffBtn.setAttribute("aria-pressed", "true");
    singleBtn.setAttribute("aria-pressed", "false");
    singleSection.hidden = true;
    diffSection.hidden = false;
    cb.onMode("diff");
  });
  modeRow.appendChild(singleBtn);
  modeRow.appendChild(diffBtn);
  root.appendChild(modeRow);

  const singleSection = el("section", { class: "section" });
  singleSection.appendChild(el("p", { class: "hint", text: "Dedupe (remove duplicate rows) or clean text (trim / normalize). You can run either; preview first, then download." }));

  const dedupeCard = el("div", { class: "card" });
  dedupeCard.appendChild(el("h3", { text: "Remove duplicates" }));
  const keySelect = el("select", { id: "dedupe-key", class: "select" });
  dedupeCard.appendChild(el("label", { text: "Key column(s)" }, keySelect));
  dedupeCard.appendChild(el("p", { class: "hint", text: "Pick a column (or several) that identifies a row. Leave 'Full row' to remove only rows that are identical in every column." }));

  const keepRow = el("div", { class: "row" });
  keepRow.appendChild(el("label", { text: "Keep", for: "dedupe-keep" }));
  const keepSel = el("select", { id: "dedupe-keep", class: "select" });
  for (const [v, label] of [
    ["first", "First occurrence"],
    ["last", "Last occurrence"],
    ["longest", "Most complete record"],
  ]) {
    keepSel.appendChild(el("option", { value: v, text: label }));
  }
  keepRow.appendChild(keepSel);
  dedupeCard.appendChild(keepRow);

  const trimLabel = el("label", { class: "check" });
  const trimKey = el("input", { type: "checkbox", checked: "true" }) as HTMLInputElement;
  trimLabel.appendChild(trimKey);
  trimLabel.appendChild(el("span", { text: " Trim keys before matching (recommended)" }));
  dedupeCard.appendChild(trimLabel);

  const caseLabel = el("label", { class: "check" });
  const caseSensitiveKey = el("input", { type: "checkbox" }) as HTMLInputElement;
  caseLabel.appendChild(caseSensitiveKey);
  caseLabel.appendChild(el("span", { text: " Case-sensitive keys" }));
  dedupeCard.appendChild(caseLabel);

  const dedupeBtn = el("button", { type: "button", class: "btn btn-primary", text: "Preview duplicates" });
  dedupeCard.appendChild(dedupeBtn);
  singleSection.appendChild(dedupeCard);

  const cleanCard = el("div", { class: "card" });
  cleanCard.appendChild(el("h3", { text: "Clean text" }));
  const trimEdgesLabel = el("label", { class: "check" });
  const trimEdges = el("input", { type: "checkbox", checked: "true" }) as HTMLInputElement;
  trimEdgesLabel.appendChild(trimEdges);
  trimEdgesLabel.appendChild(el("span", { text: " Trim leading/trailing spaces" }));
  cleanCard.appendChild(trimEdgesLabel);

  const collapseLabel = el("label", { class: "check" });
  const collapseWs = el("input", { type: "checkbox" }) as HTMLInputElement;
  collapseLabel.appendChild(collapseWs);
  collapseLabel.appendChild(el("span", { text: " Collapse internal whitespace to one space (like Excel TRIM)" }));
  cleanCard.appendChild(collapseLabel);

  const emptyTokensInput = el("input", {
    type: "text",
    class: "input",
    value: "N/A, null, None, -, —, #N/A",
    "aria-label": "Empty-like tokens to treat as blank",
  }) as HTMLInputElement;
  cleanCard.appendChild(el("label", { text: "Treat these values as blank", for: "empty-tokens" }));
  emptyTokensInput.id = "empty-tokens";
  cleanCard.appendChild(emptyTokensInput);

  const protectInput = el("input", {
    type: "text",
    class: "input",
    "aria-label": "Columns protected from cleaning",
    placeholder: "id, phone, zip (comma-separated)",
  }) as HTMLInputElement;
  cleanCard.appendChild(el("label", { text: "Protect these columns from any cleaning (e.g. ID, phone, zip)" }));
  cleanCard.appendChild(protectInput);

  const cleanBtn = el("button", { type: "button", class: "btn", text: "Preview cleaning" });
  cleanCard.appendChild(cleanBtn);
  singleSection.appendChild(cleanCard);
  root.appendChild(singleSection);

  const diffSection = el("section", { class: "section" });
  diffSection.hidden = true;
  diffSection.appendChild(el("p", { class: "hint", text: "Pick a key column in each file. Rows are matched by that key — reordering rows does not create false differences." }));

  const keyRow = el("div", { class: "row" });
  keyRow.appendChild(el("label", { text: "Key column in file A" }));
  const keySelectA = el("select", { id: "diff-key-a", class: "select" });
  keyRow.appendChild(keySelectA);
  keyRow.appendChild(el("label", { text: "Key column in file B" }));
  const keySelectB = el("select", { id: "diff-key-b", class: "select" });
  keyRow.appendChild(keySelectB);
  diffSection.appendChild(keyRow);

  const cmpRow = el("div", { class: "row" });
  const cmpTrim = el("label", { class: "check" });
  const cmpTrimCb = el("input", { type: "checkbox", checked: "true" }) as HTMLInputElement;
  cmpTrim.appendChild(cmpTrimCb);
  cmpTrim.appendChild(el("span", { text: " Ignore whitespace differences in cells" }));
  cmpRow.appendChild(cmpTrim);
  const cmpCase = el("label", { class: "check" });
  const cmpCaseCb = el("input", { type: "checkbox" }) as HTMLInputElement;
  cmpCase.appendChild(cmpCaseCb);
  cmpCase.appendChild(el("span", { text: " Case-sensitive cell comparison" }));
  cmpRow.appendChild(cmpCase);
  diffSection.appendChild(cmpRow);

  const compositeHint = el("p", {
    class: "hint",
    text: "To use a composite key, hold Ctrl/Cmd while selecting multiple columns (when supported by the browser). Otherwise run once with a single key column.",
  });
  diffSection.appendChild(compositeHint);

  const diffBtnRun = el("button", { type: "button", class: "btn btn-primary", text: "Compare files" });
  diffSection.appendChild(diffBtnRun);
  root.appendChild(diffSection);

  const emitDedupe = (): void => {
    const keys = keySelect.value === "" ? null : [Number(keySelect.value)];
    cb.onDedupe({
      keyColumns: keys,
      keepRule: keepSel.value as "first" | "last" | "longest",
      trimKeys: trimKey.checked,
      caseSensitive: caseSensitiveKey.checked,
      emptyTokensEqual: false,
    });
  };
  const emitClean = (): void => {
    const tokens = emptyTokensInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const excluded = protectInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    cb.onClean({
      options: {
        trimEdges: trimEdges.checked,
        collapseWhitespace: collapseWs.checked,
        emptyTokens: tokens,
        excludedColumns: excluded,
      },
    });
  };
  const emitDiff = (): void => {
    cb.onDiff({
      keyColumnsA: [Number(keySelectA.value)],
      keyColumnsB: [Number(keySelectB.value)],
      compare: {
        trimCells: cmpTrimCb.checked,
        caseSensitive: cmpCaseCb.checked,
        emptyTokensEqual: false,
      },
    });
  };

  keySelect.addEventListener("change", emitDedupe);
  keepSel.addEventListener("change", emitDedupe);
  trimKey.addEventListener("change", emitDedupe);
  caseSensitiveKey.addEventListener("change", emitDedupe);
  dedupeBtn.addEventListener("click", () => { emitDedupe(); cb.onRunDedupe(); });

  trimEdges.addEventListener("change", emitClean);
  collapseWs.addEventListener("change", emitClean);
  emptyTokensInput.addEventListener("change", emitClean);
  protectInput.addEventListener("change", emitClean);
  cleanBtn.addEventListener("click", () => { emitClean(); cb.onRunClean(); });

  keySelectA.addEventListener("change", emitDiff);
  keySelectB.addEventListener("change", emitDiff);
  cmpTrimCb.addEventListener("change", emitDiff);
  cmpCaseCb.addEventListener("change", emitDiff);
  diffBtnRun.addEventListener("click", () => { emitDiff(); cb.onRunDiff(); });

  // Populate column dropdowns from a Table — called by app.ts
  function populateColumns(table: Table | null, isDiff: boolean): void {
    if (isDiff) {
      clear(keySelectA);
      clear(keySelectB);
      if (!table) {
        keySelectA.appendChild(el("option", { value: "", text: "Load a file first" }));
        keySelectB.appendChild(el("option", { value: "", text: "Load a file first" }));
        return;
      }
      table.headers.forEach((h, i) => {
        const opt = el("option", { value: String(i), text: `${h} (col ${i + 1})` });
        keySelectA.appendChild(opt);
        const opt2 = el("option", { value: String(i), text: `${h} (col ${i + 1})` });
        keySelectB.appendChild(opt2);
      });
      // Sensible default: column whose name looks like an id.
      const guess = table.headers.findIndex((h) => /(^|[^a-z])(id|ids|code|sku|email|name)([^a-z]|$)/i.test(h));
      if (guess >= 0) {
        keySelectA.value = String(guess);
        keySelectB.value = String(guess);
      }
    } else {
      clear(keySelect);
      const fullOpt = el("option", { value: "", text: "Full row (all columns)" });
      keySelect.appendChild(fullOpt);
      if (!table) {
        keySelect.appendChild(el("option", { value: "", text: "Load a file first", disabled: "true" }));
        return;
      }
      table.headers.forEach((h, i) => {
        keySelect.appendChild(el("option", { value: String(i), text: `${h} (col ${i + 1})` }));
      });
    }
  }

  (root as HTMLElement & { populateColumns?: (t: Table | null, isDiff: boolean) => void }).populateColumns = populateColumns;
  return root;
}
