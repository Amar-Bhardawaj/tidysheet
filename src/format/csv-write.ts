/**
 * RFC 4180 CSV/TSV serialization. Pure string logic; used by exports and by
 * the report builder. Loader-side escaping rules mirror this module.
 */

export interface WriteOptions {
  delimiter: string;
  /** Prepend a UTF-8 BOM so Excel re-opens the file with the right decoding. */
  bom: boolean;
  newline: "\r\n" | "\n";
}

export const DEFAULT_WRITE_OPTIONS: WriteOptions = { delimiter: ",", bom: true, newline: "\r\n" };

/** Quote a field when the delimiter, quote, or newline appears in it. */
export function csvField(field: string, delimiter: string): string {
  const needsQuote =
    field.includes(delimiter) ||
    field.includes('"') ||
    /[\r\n]/.test(field) ||
    /^[ \t]/.test(field) ||
    /[ \t]$/.test(field);
  if (!needsQuote) return field;
  return '"' + field.replaceAll('"', '""') + '"';
}

/** Serialize headers + rows as one CSV string. */
export function toCsv(headers: string[], rows: string[][], options?: Partial<WriteOptions>): string {
  const opts = { ...DEFAULT_WRITE_OPTIONS, ...options };
  const lines: string[] = [];
  lines.push(headers.map((h) => csvField(h, opts.delimiter)).join(opts.delimiter));
  for (const row of rows) {
    lines.push(row.map((c) => csvField(c ?? "", opts.delimiter)).join(opts.delimiter));
  }
  const text = lines.join(opts.newline) + opts.newline;
  return opts.bom ? "\ufeff" + text : text;
}

/** Serialize headers + rows as a TSV string (BOM off by default). */
export function toTsv(headers: string[], rows: string[][], bom = false): string {
  return toCsv(headers, rows, { delimiter: "\t", bom, newline: "\r\n" });
}
