/**
 * CSV parsing wrapper. Single place that talks to papaparse; core logic stays
 * independent. Exposes parse-from-bytes with encoding sniffing and a strict
 * Table shape (headers + raw string rows + 1-based source row numbers).
 */

import Papa from "papaparse";
import type { Delimiter, EncodingName, Table } from "../core/types.js";
import {
  containsNul,
  looksBinary,
  resolveDuplicateHeaders,
  sniffEncoding,
} from "../core/normalize.js";
import { ERROR_MESSAGES, ValidationError } from "../core/errors.js";

export interface ParseOptions {
  /** Force a delimiter; "auto" lets papaparse guess. */
  delimiter: Delimiter | "auto";
  /** Max file size in bytes; checked against the decoded text length. */
  maxBytes?: number;
  /** Max data rows; beyond this the parse is rejected with ROW_LIMIT. */
  maxRows?: number;
  /** Source file name for messages. */
  sourceName?: string;
}

export const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  delimiter: "auto",
  maxBytes: 100 * 1024 * 1024,
  maxRows: 2_000_000,
};

/** Known encoding label for TextDecoder; latin1 always succeeds. */
function decoderFor(encoding: EncodingName): TextDecoder {
  switch (encoding) {
    case "utf-8":
      return new TextDecoder("utf-8");
    case "utf-16le":
      return new TextDecoder("utf-16le");
    case "utf-16be":
      return new TextDecoder("utf-16be");
    default:
      return new TextDecoder("latin1");
  }
}

/** Decode raw bytes to a JS string using the sniffed encoding. */
export function decodeBytes(bytes: Uint8Array): string {
  if (bytes.byteLength === 0) {
    throw new ValidationError("EMPTY_FILE", ERROR_MESSAGES.EMPTY_FILE);
  }
  if (containsNul(bytes)) {
    throw new ValidationError(
      "BINARY_FILE",
      ERROR_MESSAGES.BINARY_FILE
    );
  }
  if (looksBinary(bytes)) {
    throw new ValidationError(
      "BINARY_FILE",
      ERROR_MESSAGES.BINARY_FILE
    );
  }
  const encoding = sniffEncoding(bytes);
  const decoder = decoderFor(encoding);
  const text = decoder.decode(bytes);
  if (text.trim().length === 0) {
    throw new ValidationError("EMPTY_FILE", ERROR_MESSAGES.EMPTY_FILE);
  }
  return text;
}

/** Parse raw file bytes into a validated Table. */
export function parseTableFromBytes(bytes: Uint8Array, options: ParseOptions): Table {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  if (opts.maxBytes && bytes.byteLength > opts.maxBytes) {
    throw new ValidationError("SIZE_LIMIT", ERROR_MESSAGES.SIZE_LIMIT, { limit: formatBytes(opts.maxBytes) });
  }
  const text = decodeBytes(bytes);
  if (opts.maxBytes && text.length > opts.maxBytes) {
    throw new ValidationError("SIZE_LIMIT", ERROR_MESSAGES.SIZE_LIMIT, { limit: formatBytes(opts.maxBytes) });
  }
  return parseTableFromText(text, opts);
}

/** Parse an already-decoded CSV text into a validated Table. */
export function parseTableFromText(text: string, options: ParseOptions): Table {
  const opts = { ...DEFAULT_PARSE_OPTIONS, ...options };
  const delimiter = opts.delimiter === "auto" ? undefined : opts.delimiter;

  let parsed: Papa.ParseResult<string[]>;
  try {
    parsed = Papa.parse<string[]>(text, {
      header: false,
      delimiter,
      skipEmptyLines: false,
      dynamicTyping: false,
      preview: opts.maxRows ? opts.maxRows + 2 : undefined,
      comments: false,
      transform: (value: string) => value,
    });
  } catch (err) {
    throw new ValidationError("PARSE_FAILED", ERROR_MESSAGES.PARSE_FAILED, { detail: String(err) });
  }

  const allRows = parsed.data as string[][];
  const parseErrors = parsed.errors ?? [];

  // Skip leading/trailing fully-blank lines ourselves but keep a note.
  let blankSkipped = 0;
  let dataRows = allRows;
  {
    let start = 0;
    while (start < dataRows.length && isBlankRowArr(dataRows[start])) start++;
    let end = dataRows.length;
    while (end > start && isBlankRowArr(dataRows[end - 1])) end--;
    blankSkipped = dataRows.length - (end - start);
    dataRows = dataRows.slice(start, end);
  }

  if (dataRows.length === 0) {
    throw new ValidationError("EMPTY_FILE", ERROR_MESSAGES.EMPTY_FILE);
  }

  const first = dataRows[0];
  const width = dataRows.reduce((max, r) => Math.max(max, r.length), first.length || 1);

  // Header handling: first row is the header; pad missing header cells.
  const rawHeaders: string[] = new Array(width);
  for (let c = 0; c < width; c++) {
    const v = first[c] ?? "";
    rawHeaders[c] = v.trim() === "" ? `column ${c + 1}` : v.trim();
  }

  // Data rows: pad shorter rows with ""; a row longer than the header is not truncated.
  const { headers, renamed } = resolveDuplicateHeaders(rawHeaders);
  const notices: string[] = [];
  if (Object.keys(renamed).length > 0) {
    const pairs = Object.entries(renamed)
      .map(([i, name]) => `${rawHeaders[Number(i)]} → ${name}`)
      .join(", ");
    notices.push(`Duplicate column names were renamed automatically: ${pairs}`);
  }

  const rows: string[][] = new Array(dataRows.length - 1);
  for (let r = 1; r < dataRows.length; r++) {
    const src = dataRows[r];
    if (src.length > width) {
      // Keep extra cells: extend headers so no data is silently lost.
      for (let c = width; c < src.length; c++) notices.push(`Row ${r} had more cells than the header row; extra column "${c + 1}" added.`) ;
      // extend common headers (only once)
      while (headers.length < src.length) headers.push(`column ${headers.length + 1}`);
      // also extend rawHeaders for consistent width
      while (rawHeaders.length < src.length) rawHeaders.push(`column ${rawHeaders.length + 1}`);
    }
    const padded: string[] = new Array(Math.max(width, src.length));
    for (let c = 0; c < padded.length; c++) padded[c] = src[c] ?? "";
    rows[r - 1] = padded;
  }

  if (blankSkipped > 0) {
    notices.push(`${blankSkipped} blank line${blankSkipped === 1 ? "" : "s"} in the file were ignored.`);
  }
  if (parseErrors.length > 0) {
    const summary = parseErrors.slice(0, 3).map((e) => `${e.type ?? "error"}: row ${e.row ?? "?"}`).join("; ");
    notices.push(`The parser reported irregularities (${summary}). Values may be affected — check the preview carefully.`);
    if (parsed.data.length === 0) {
      throw new ValidationError("PARSE_FAILED", ERROR_MESSAGES.PARSE_FAILED, { detail: summary });
    }
  }

  const sourceRowNumbers: number[] = new Array(rows.length);
  for (let i = 0; i < rows.length; i++) sourceRowNumbers[i] = i + 1;

  return {
    headers,
    rows,
    sourceRowNumbers,
    notices,
    delimiter: parsed.meta?.delimiter as Delimiter | undefined,
    sourceName: opts.sourceName,
  };
}

function isBlankRowArr(cells: string[]): boolean {
  if (!cells || cells.length === 0) return true;
  return cells.every((c) => (c ?? "").trim() === "");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${Math.round((n / 1024 / 1024) * 10) / 10} MB`;
}
