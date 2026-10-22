import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTableFromText } from "../src/format/csv.js";
import { toCsv } from "../src/format/csv-write.js";
import { buildDiffReport, removedRowsCsv } from "../src/core/report.js";
import { diffTables } from "../src/core/diff.js";
import { DEFAULT_COMPARE_OPTIONS } from "../src/core/types.js";

function table(text: string) {
  return parseTableFromText(text, { delimiter: "auto" });
}

test("csv-write: round trip parse→write→parse preserves values", () => {
  const t = table("id,name,note\n1,Alice,\"has, comma\"\n2,Bob,line2\n");
  const text = toCsv(t.headers, t.rows, { bom: false, delimiter: ",", newline: "\n" });
  const t2 = parseTableFromText(text, { delimiter: "auto" });
  assert.deepEqual(t2.headers, t.headers);
  assert.deepEqual(t2.rows, t.rows);
});

test("csv-write: quotes fields with delimiters/quotes/newlines", () => {
  const text = toCsv(["a", "b"], [["x", "has \"quote\" and, comma"]], { bom: false, delimiter: ",", newline: "\n" });
  assert.match(text, /"has ""quote"" and, comma"/);
});

test("csv-write: BOM prepended when requested", () => {
  const text = toCsv(["a"], [["1"]], { bom: true, delimiter: ",", newline: "\n" });
  assert.equal(text.charCodeAt(0), 0xfeff);
});

test("report: diff report contains counts and changed row detail", () => {
  const a = table("id,name,amount\n1,Alice,100\n2,Bob,50\n");
  const b = table("id,name,amount\n1,Alice,200\n3,Carol,75\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare: { ...DEFAULT_COMPARE_OPTIONS, trimCells: true, caseSensitive: false, emptyTokensEqual: false } });
  const csv = buildDiffReport(a, b, r, {
    fileA: "a.csv",
    fileB: "b.csv",
    keyColumnsA: ["id"],
    keyColumnsB: ["id"],
    generatedAt: "2026-10-22T00:00:00.000Z",
    toolName: "TidySheet",
  });
  assert.match(csv, /Added \(in B only\),1/);
  assert.match(csv, /Removed \(in A only\),1/);
  assert.match(csv, /Changed,1/);
  assert.match(csv, /amount: 100 → 200/);
});

test("report: removed-rows CSV includes source row numbers", () => {
  const t = table("id,name\n1,Alice\n2,Bob\n3,Carol\n");
  const csv = removedRowsCsv(t, [1]);
  assert.match(csv, /Source row/);
  assert.match(csv, /^2,2,Bob/m);
});

test("report: duplicate-key warning appears in report", () => {
  const a = table("id,name\n1,Alice\n1,Alice2\n");
  const b = table("id,name\n1,Bob\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare: { ...DEFAULT_COMPARE_OPTIONS, trimCells: true, caseSensitive: false, emptyTokensEqual: false } });
  const csv = buildDiffReport(a, b, r, {
    fileA: "a.csv", fileB: "b.csv", keyColumnsA: ["id"], keyColumnsB: ["id"],
    generatedAt: "2026-10-22T00:00:00.000Z", toolName: "TidySheet",
  });
  assert.match(csv, /WARNING duplicate keys/);
});
