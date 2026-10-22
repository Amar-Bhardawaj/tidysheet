import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTableFromText } from "../src/format/csv.js";
import { cleanTable } from "../src/core/clean.js";
import { DEFAULT_CLEAN_OPTIONS } from "../src/core/clean.js";

function table(text: string) {
  return parseTableFromText(text, { delimiter: "auto" });
}

test("clean: trims edges by default", () => {
  const t = table("name\n  Alice  \nBob\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: [] });
  assert.equal(r.table.rows[0][0], "Alice");
  assert.equal(r.totalChangedCells, 1);
});

test("clean: collapse internal whitespace", () => {
  const t = table("name\nAlice   Bob\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: true, emptyTokens: [], excludedColumns: [] });
  assert.equal(r.table.rows[0][0], "Alice Bob");
});

test("clean: empty-token normalization", () => {
  const t = table("name\nN/A\nnull\n-\nreal\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: ["n/a", "null", "-"], excludedColumns: [] });
  assert.equal(r.table.rows[0][0], "");
  assert.equal(r.table.rows[1][0], "");
  assert.equal(r.table.rows[2][0], "");
  assert.equal(r.table.rows[3][0], "real");
});

test("clean: excluded columns untouched (leading zeros / IDs)", () => {
  const t = table("id,name\n00123,  Alice  \n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: ["id"] });
  assert.equal(r.table.rows[0][0], "00123"); // untouched (was already clean)
  assert.equal(r.table.rows[0][1], "Alice");
  // id column must not appear in changes
  assert.ok(!r.changes.some((c) => c.header === "id"));
});

test("clean: protected column with leading space stays as-is when excluded", () => {
  const t = table("code,val\n 007 ,x\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: ["code"] });
  assert.equal(r.table.rows[0][0], " 007 "); // excluded → untouched
  assert.equal(r.table.rows[0][1], "x");
});

test("clean: never rewrites numeric strings", () => {
  const t = table("amount\n1.0\n007\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: [] });
  assert.equal(r.table.rows[0][0], "1.0");
  assert.equal(r.table.rows[1][0], "007");
});

test("clean: original table not mutated", () => {
  const t = table("name\n  x  \n");
  const before = t.rows[0][0];
  cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: [] });
  assert.equal(t.rows[0][0], before);
});

test("clean: no changes → totalChangedCells 0", () => {
  const t = table("name\nAlice\nBob\n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: [] });
  assert.equal(r.totalChangedCells, 0);
  assert.equal(r.changes.length, 0);
});

test("clean: before/after examples captured", () => {
  const t = table("name\n  Alice  \n");
  const r = cleanTable(t, { ...DEFAULT_CLEAN_OPTIONS, trimEdges: true, collapseWhitespace: false, emptyTokens: [], excludedColumns: [] });
  assert.equal(r.changes[0].examples.length, 1);
  assert.equal(r.changes[0].examples[0].before, "  Alice  ");
  assert.equal(r.changes[0].examples[0].after, "Alice");
});
