/**
 * Preview table: renders a limited slice of rows with status highlighting.
 * Colors are always paired with text/ARIA labels (never color alone).
 */

import { el, clear } from "./components.js";
import { LIMITS } from "../core/normalize.js";

export interface PreviewColumn {
  header: string;
  index: number;
}

export type RowStatus = "added" | "removed" | "changed" | "unchanged" | "duplicate" | "cleaned";

export interface PreviewRow {
  status: RowStatus;
  cells: string[];
  rowNumber?: number;
  rowNumberB?: number;
}

export function renderPreview(
  container: HTMLElement,
  columns: PreviewColumn[],
  rows: PreviewRow[],
  meta: { totalShown: number; totalRows: number; hint?: string }
): void {
  clear(container);
  if (rows.length === 0) {
    container.appendChild(
      el("p", { class: "empty-note", text: "Nothing to preview." })
    );
    return;
  }
  const shownColumns = columns.slice(0, LIMITS.MAX_PREVIEW_COLUMNS);
  const shownRows = rows.slice(0, LIMITS.MAX_PREVIEW_ROWS);

  const table = el("table", { class: "preview" });
  table.setAttribute("aria-label", "Preview of proposed changes");

  const caption = el("caption", { class: "sr-only", text: "Preview of proposed changes. Columns: Status, Row, followed by data columns. Rows are color-coded by status." });
  table.appendChild(caption);

  const thead = el("thead");
  const hr = el("tr");
  hr.appendChild(el("th", { scope: "col", text: "Status", class: "sticky-col" }));
  hr.appendChild(el("th", { scope: "col", text: "Row" }));
  for (const col of shownColumns) {
    hr.appendChild(el("th", { scope: "col", text: col.header }));
  }
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el("tbody");
  for (const row of shownRows) {
    const tr = el("tr", { class: `status-${row.status}` });
    const label =
      row.status === "unchanged" ? "unchanged" : row.status;
    tr.appendChild(el("td", { text: label, class: "sticky-col" }));
    tr.appendChild(
      el("td", {
        text: row.rowNumber && row.rowNumberB ? `${row.rowNumber} → ${row.rowNumberB}` : String(row.rowNumber ?? ""),
      })
    );
    for (const col of shownColumns) {
      tr.appendChild(el("td", { text: row.cells[col.index] ?? "" }));
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  const scrollWrapper = el("div", { class: "table-scroll" });
  scrollWrapper.appendChild(table);
  container.appendChild(scrollWrapper);

  const extra = meta.totalRows - shownRows.length;
  if (extra > 0) {
    container.appendChild(
      el("p", {
        class: "preview-note",
        text: `Showing first ${shownRows.length} rows of ${meta.totalRows}. The full result is included when you download.`,
      })
    );
  }
  if (meta.hint) {
    container.appendChild(el("p", { class: "preview-note", text: meta.hint }));
  }
  void meta.totalShown;
}
