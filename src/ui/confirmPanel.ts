/**
 * Confirm panel: destructive-action confirmation + download buttons.
 * Required for any operation that removes rows from the output.
 */

import { el, clear } from "./components.js";

export interface ConfirmActions {
  onConfirm: () => void;
  onCancel: () => void;
  onDownload: (label: string) => void;
}

export function createConfirmPanel(actions: ConfirmActions): HTMLElement {
  const root = el("div", { class: "confirm-panel" });
  root.hidden = true;

  const summary = el("div", { class: "confirm-summary" });
  const body = el("p", { class: "confirm-body", text: "" });
  summary.appendChild(body);

  const buttonRow = el("div", { class: "btn-row" });
  const confirmBtn = el("button", { type: "button", class: "btn btn-danger", text: "Confirm and apply" });
  const cancelBtn = el("button", { type: "button", class: "btn", text: "Cancel" });
  buttonRow.appendChild(confirmBtn);
  buttonRow.appendChild(cancelBtn);

  const downloadRow = el("div", { class: "btn-row" });

  root.appendChild(summary);
  root.appendChild(buttonRow);
  root.appendChild(downloadRow);

  confirmBtn.addEventListener("click", () => actions.onConfirm());
  cancelBtn.addEventListener("click", () => actions.onCancel());

  function show(message: string, downloads: Array<{ label: string; fileName: string }>): void {
    body.textContent = message;
    clear(downloadRow);
    for (const d of downloads) {
      const btn = el("button", { type: "button", class: "btn btn-primary", text: d.label });
      btn.addEventListener("click", () => actions.onDownload(d.label));
      downloadRow.appendChild(btn);
    }
    root.hidden = false;
  }

  function hide(): void {
    root.hidden = true;
    clear(downloadRow);
  }

  (root as HTMLElement & { show?: typeof show; hide?: typeof hide }).show = show;
  (root as HTMLElement & { show?: typeof show; hide?: typeof hide }).hide = hide;
  return root;
}
