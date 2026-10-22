import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTableFromText } from "../src/format/csv.js";
import { diffTables } from "../src/core/diff.js";
import { DEFAULT_COMPARE_OPTIONS } from "../src/core/types.js";

function table(text: string) {
  return parseTableFromText(text, { delimiter: "auto" });
}

const compare = { ...DEFAULT_COMPARE_OPTIONS, trimCells: true, caseSensitive: false, emptyTokensEqual: false };

test("diff: identical files → no changes", () => {
  const a = table("id,name\n1,Alice\n2,Bob\n");
  const b = table("id,name\n1,Alice\n2,Bob\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.added.length, 0);
  assert.equal(r.removed.length, 0);
  assert.equal(r.changed.length, 0);
  assert.equal(r.unchangedCount, 2);
});

test("diff: reordered rows → no false changes", () => {
  const a = table("id,name\n1,Alice\n2,Bob\n3,Carol\n");
  const b = table("id,name\n3,Carol\n1,Alice\n2,Bob\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.changed.length, 0);
  assert.equal(r.added.length, 0);
  assert.equal(r.removed.length, 0);
  assert.equal(r.unchangedCount, 3);
});

test("diff: added and removed rows", () => {
  const a = table("id,name\n1,Alice\n2,Bob\n");
  const b = table("id,name\n1,Alice\n3,Carol\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.added.length, 1);
  assert.equal(r.removed.length, 1);
  assert.equal(r.added[0].rowNumberB, 2);
  assert.equal(r.removed[0].rowNumberA, 2);
});

test("diff: changed cell reported with before/after", () => {
  const a = table("id,name,amount\n1,Alice,100\n");
  const b = table("id,name,amount\n1,Alice,200\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.changed.length, 1);
  assert.equal(r.changed[0].cells.length, 1);
  assert.equal(r.changed[0].cells[0].header, "amount");
  assert.equal(r.changed[0].cells[0].valueA, "100");
  assert.equal(r.changed[0].cells[0].valueB, "200");
});

test("diff: composite key", () => {
  const a = table("first,last,email\nA,B,x@y\nA,C,x@y\n");
  const b = table("first,last,email\nA,B,x@y\nA,C,x@z\n");
  const r = diffTables(a, b, { keyColumnsA: [0, 1], keyColumnsB: [0, 1], compare });
  assert.equal(r.changed.length, 1);
  assert.equal(r.changed[0].cells[0].header, "email");
});

test("diff: different column order between files still matches columns", () => {
  const a = table("id,name,amount\n1,Alice,100\n");
  const b = table("amount,id,name\n100,1,Alice\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [1], compare });
  assert.equal(r.changed.length, 0);
  assert.equal(r.unchangedCount, 1);
});

test("diff: duplicate keys warned (not silently mis-paired)", () => {
  const a = table("id,name\n1,Alice\n1,Alice2\n");
  const b = table("id,name\n1,Bob\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.duplicateKeysA.length, 1);
  assert.equal(r.duplicateKeysA[0].rowNumbers.length, 2);
  // one paired, one orphan-removed
  assert.equal(r.changed.length + r.removed.length, 2);
});

test("diff: whitespace-insensitive compare (default trimCells true)", () => {
  const a = table("id,name\n1, Alice \n");
  const b = table("id,name\n1,Alice\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.changed.length, 0);
  assert.equal(r.unchangedCount, 1);
});

test("diff: case-sensitive cell comparison reports change", () => {
  const c = { ...compare, caseSensitive: true };
  const a = table("id,name\n1,alice\n");
  const b = table("id,name\n1,Alice\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare: c });
  assert.equal(r.changed.length, 1);
});

test("diff: unicode keys and values", () => {
  const a = table("id,name\nα,café\n");
  const b = table("id,name\nα,café\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.unchangedCount, 1);
});

test("diff: leading zeros in keys preserved", () => {
  const a = table("id,name\n00123,Alice\n");
  const b = table("id,name\n00123,Alice\n00124,Bob\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.added.length, 1);
  assert.equal(r.unchangedCount, 1);
});

test("diff: date/time values compared as text (no silent normalization)", () => {
  const a = table("id,d\n1,2024-01-02\n");
  const b = table("id,d\n1,02/01/2024\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.changed.length, 1); // documented: not normalized
});

test("diff: empty/missing values reported as change", () => {
  const a = table("id,name\n1,Alice\n");
  const b = table("id,name\n1,\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.changed.length, 1);
});

test("diff: empty tables handled", () => {
  const a = table("id,name\n");
  const b = table("id,name\n1,Alice\n");
  const r = diffTables(a, b, { keyColumnsA: [0], keyColumnsB: [0], compare });
  assert.equal(r.added.length, 1);
  assert.equal(r.removed.length, 0);
  assert.equal(r.unchangedCount, 0);
});
