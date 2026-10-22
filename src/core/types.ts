/**
 * Core types shared by the engine (dedupe/diff/clean), the format layer,
 * and the UI. Pure data only — never DOM/node APIs live here.
 */

/** A parsed table. Cells are raw strings on purpose: the engine never
 * re-parses numbers or dates, so identifiers and leading zeros are safe. */
export interface Table {
  /** Column names as they appeared (or were auto-renamed for duplicates). */
  headers: string[];
  /** Data rows, in file order. Row i is original (1-based) data row `sourceRowNumbers[i]`. */
  rows: string[][];
  /** Parallel to rows: 1-based row number in the source file (excluding header). */
  sourceRowNumbers: number[];
  /** Human-readable notices from parsing/validation (not errors). */
  notices: string[];
  /** The delimiter that was actually used (informational). */
  delimiter?: Delimiter;
  /** Original file name, when known. */
  sourceName?: string;
}

export type Delimiter = "," | ";" | "\t" | "|";

export type EncodingName = "utf-8" | "utf-16le" | "utf-16be" | "latin1";

/** Options controlling how two text cells are compared as "equal". */
export interface CompareOptions {
  /** Ignore leading/trailing whitespace when comparing. Default true. */
  trimCells: boolean;
  /** Case-insensitive comparison. Default false (A≠a on screen must be visible). */
  caseSensitive: boolean;
  /** Treat the configured empty-like tokens (e.g. "N/A") as empty. Default false. */
  emptyTokensEqual: boolean;
}

/** Options for key-based matching (dedupe and diff share this). */
export interface MatchOptions extends CompareOptions {
  /** Index of key columns; null means full-row mode. */
  keyColumns: number[] | null;
}

export const DEFAULT_COMPARE_OPTIONS: CompareOptions = {
  trimCells: true,
  caseSensitive: false,
  emptyTokensEqual: false,
};

export const DEFAULT_EMPTY_TOKENS = ["", "n/a", "na", "null", "none", "-", "—", "#n/a", "#value!"];

/** Result of planning a dedupe operation (no data mutated yet). */
export interface DedupePlan {
  /** Indices into table.rows kept in the output, in file order. */
  keepIndices: number[];
  /** Indices into table.rows removed by the operation. */
  dropIndices: number[];
  /** Grouped duplicates for preview: key signature -> member row indices. */
  groups: DuplicateGroup[];
  /** The column indices used as the dupe key (null = full row). */
  keyColumns: number[] | null;
  /** Original total row count. */
  totalRows: number;
}

export interface DuplicateGroup {
  /** Normalized key signature of the group. */
  key: string;
  /** 1-based source row numbers in this duplicate group. */
  rowNumbers: number[];
  /** Index in table.rows that would be kept according to the keep-rule. */
  keepIndex: number;
}

export type KeepRule = "first" | "last" | "longest";

/** Column classification used by cleaning and warnings. */
export interface ColumnProfile {
  index: number;
  header: string;
  /** Counts of cells whose value differs after a given clean operation. */
  nonEmptyCount: number;
  /** True if at least one value begins with "0" and looks identifier-ish. */
  hasLeadingZeros: boolean;
  /** True if every non-empty value parses as an integer. */
  allIntegers: boolean;
}

/** A single cell-level change in a diff. */
export interface CellChange {
  column: number;
  header: string;
  valueA: string;
  valueB: string;
}

export interface DifRowChange {
  rowA: number;   // index into table A rows (or -1)
  rowB: number;   // index into table B rows (or -1)
  rowNumberA: number; // 1-based source row number in file A (or 0)
  rowNumberB: number; // 1-based source row number in file B (or 0)
  key?: string;
  cells: CellChange[];
  /** True when the row was only compared after duplicate-key pairing fallback. */
  viaDuplicatePairing: boolean;
}

export interface DiffResult {
  keyColumnsA: number[] | null;
  keyColumnsB: number[] | null;
  added: DifRowChange[];    // present in B only
  removed: DifRowChange[];  // present in A only
  changed: DifRowChange[];
  unchangedCount: number;
  /** Duplicate-key situations detected per file, for loud warnings. */
  duplicateKeysA: DuplicateKeyInfo[];
  duplicateKeysB: DuplicateKeyInfo[];
}

export interface DuplicateKeyInfo {
  /** Normalized key value that appeared more than once. */
  key: string;
  /** 1-based source row numbers sharing this key in that file. */
  rowNumbers: number[];
}
