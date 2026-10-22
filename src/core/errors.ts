/**
 * Validation error taxonomy. Errors are plain data: the UI maps codes to
 * friendly copy; no stack traces or absolute paths ever surface here.
 */

export type ErrorCode =
  | "EMPTY_FILE"
  | "SIZE_LIMIT"
  | "ROW_LIMIT"
  | "ENCODING_FAILED"
  | "PARSE_FAILED"
  | "BINARY_FILE"
  | "UNSUPPORTED_DELIMITER"
  | "BAD_INPUT"
  | "UNKNOWN";

export class ValidationError extends Error {
  readonly code: ErrorCode;
  /** Additional context values for the UI (never absolute paths). */
  readonly detail?: Record<string, string | number>;

  constructor(code: ErrorCode, message: string, detail?: Record<string, string | number>) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.detail = detail;
  }
}

/** Map of UI-ready messages. Deliberately free of technical jargon. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  EMPTY_FILE:
    "That file seems to be empty (or contains only blank lines). Check whether you exported the right file.",
  SIZE_LIMIT:
    "That file is above this tool's working limit ({limit}). Large exports like this need a different workflow — please export a smaller slice or contact the owner about a future offline edition.",
  ROW_LIMIT:
    "This file has more data rows than this tool can compare in a browser ({limit}). Please split the file first (the official Excel “row splitter” tools can help) and compare in parts.",
  ENCODING_FAILED:
    "The file's text encoding could not be determined. Re-export it as UTF-8 CSV and try again.",
  PARSE_FAILED:
    "The file could not be read as CSV/tabular text ({detail}). If it opens in Excel with unusual characters, the file may be corrupted — re-export it.",
  BINARY_FILE:
    "That file does not look like a text/CSV file (it starts with binary content). Only CSV, TSV and text-delimited files are supported.",
  UNSUPPORTED_DELIMITER:
    "The column separator could not be detected. This tool supports comma, semicolon, tab and pipe-delimited files.",
  BAD_INPUT: "Unexpected internal input for that operation.",
  UNKNOWN: "Something unexpected went wrong while processing your file. Please try again.",
};

export function formatError(err: unknown): { code: ErrorCode; message: string } {
  if (err instanceof ValidationError) {
    let msg = ERROR_MESSAGES[err.code];
    if (err.detail) {
      for (const [k, v] of Object.entries(err.detail)) {
        msg = msg.replaceAll(`{${k}}`, String(v));
      }
    }
    return { code: err.code, message: msg };
  }
  return { code: "UNKNOWN", message: ERROR_MESSAGES.UNKNOWN };
}
