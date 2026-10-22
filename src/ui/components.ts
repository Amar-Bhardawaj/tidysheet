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
