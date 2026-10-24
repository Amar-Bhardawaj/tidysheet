/**
 * Tiny DOM builder helpers. Everything renders through textContent /
 * createElement — never innerHTML — so file content can never inject markup.
 */

export type Attrs = Record<string, string | number | boolean | undefined | null>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  ...children: Array<Node | string | null | undefined | false>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (name === "class") node.className = String(value);
      else if (name === "text") node.textContent = String(value);
      else if (name.startsWith("on") && typeof value === "function") {
        (node as unknown as Record<string, unknown>)[name] = value;
      } else node.setAttribute(name, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === "string") {
      node.appendChild(document.createTextNode(child));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

/** Element with aria-label + title. */
export function labelled(node: HTMLElement, label: string): HTMLElement {
  node.setAttribute("aria-label", label);
  node.setAttribute("title", label);
  return node;
}

/** Replace all children of a container. */
export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Human byte size for status lines. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${Math.round((n / (1024 * 1024)) * 10) / 10} MB`;
}

/** Show a toast notification. Auto-dismisses after `duration` ms. */
export function showToast(message: string, type: "success" | "warning" | "error" = "success", duration = 3000): void {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = el("div", { id: "toast-container", class: "toast-container", "aria-live": "polite" });
    document.body.appendChild(container);
  }
  const toast = el("div", { class: `toast toast-${type}`, role: "alert" });
  toast.appendChild(document.createTextNode(message));
  const dismiss = el("button", { class: "toast-dismiss", type: "button", "aria-label": "Dismiss notification", text: "×" });
  dismiss.addEventListener("click", () => removeToast(toast));
  toast.appendChild(dismiss);
  container.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast: HTMLElement): void {
  if (toast.classList.contains("removing")) return;
  toast.classList.add("removing");
  setTimeout(() => { toast.remove(); }, 200);
}

/** Trigger a client-side file download (no network involved). */
export function downloadText(fileName: string, text: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
