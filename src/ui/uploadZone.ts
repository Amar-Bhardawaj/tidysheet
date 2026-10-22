/**
 * Drag-and-drop + file input control. Reports selected File objects to the
 * caller; validation happens in the worker once the file is parsed.
 */

import { el, formatBytes } from "./components.js";

export interface UploadCallbacks {
  onFiles: (files: File[]) => void;
}

export function createUploadZone(cb: UploadCallbacks): HTMLElement {
  const input = el("input", {
    type: "file",
    id: "file-input",
    accept: ".csv,.tsv,.txt",
    multiple: "true",
  }) as HTMLInputElement;
  input.hidden = true;

  const zone = el("div", {
    class: "upload-zone",
    role: "button",
    tabindex: "0",
    "aria-label": "Choose one or two CSV/TSV files (drag and drop or press Enter)",
  });
  zone.appendChild(el("p", { class: "upload-title", text: "Drop your CSV/TSV file(s) here" }));
  zone.appendChild(el("p", { class: "upload-sub", text: "or click to browse — one file for cleaning/dedupe, two for a diff" }));
  zone.appendChild(el("p", { class: "upload-meta", text: "CSV, TSV and text-delimited. Up to 100 MB per file. Nothing is uploaded — everything runs in this tab." }));
  zone.appendChild(input);

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener("change", () => {
    if (input.files && input.files.length > 0) {
      cb.onFiles(Array.from(input.files));
      input.value = "";
    }
  });
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      cb.onFiles(Array.from(e.dataTransfer.files));
    }
  });
  return zone;
}

export function fileStatusCard(name: string, size: number, note: string, status: "ok" | "error" = "ok"): HTMLElement {
  const card = el("div", { class: `file-card file-card--${status}` });
  card.appendChild(el("p", { class: "file-name", text: name }));
  card.appendChild(el("p", { class: "file-meta", text: `${formatBytes(size)} — ${note}` }));
  return card;
}
