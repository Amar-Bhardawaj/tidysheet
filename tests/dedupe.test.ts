import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTableFromText } from "../src/format/csv.js";
import { planDedupe, applyDedupe } from "../src/core/dedupe.js";

function table(text: string) {
  return parseTableFromText(text, { delimiter: "auto" });
}

test("dedupe: full-row duplicates removed, count matches preview", () => {
  const t = table("id,name\n1,Alice\n1,Alice\n2,Bob\n");
  const plan = planDedupe(t, { keyColumns: null, keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 1);
  assert.equal(plan.keepIndices.length, 2);
  const out = applyDedupe(t, plan);
  assert.equal(out.rows.length, 2);
});

test("dedupe: by single key column keeps first by default", () => {
  const t = table("id,name\n1,Alice\n1,Alice2\n2,Bob\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 1);
  const out = applyDedupe(t, plan);
  assert.deepEqual(out.rows[0], ["1", "Alice"]);
});

test("dedupe: keep-rule 'last' keeps last", () => {
  const t = table("id,name\n1,Alice\n1,Alice2\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "last", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  const out = applyDedupe(t, plan);
  assert.deepEqual(out.rows[0], ["1", "Alice2"]);
});

test("dedupe: keep-rule 'longest' keeps most complete", () => {
  const t = table("id,name,note\n1,A,\n1,Alice,has note here\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "longest", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  const out = applyDedupe(t, plan);
  assert.equal(out.rows[0][1], "Alice");
});

test("dedupe: composite key", () => {
  const t = table("first,last,email\nA,B,x@y\nA,B,x@y\nA,C,x@y\n");
  const plan = planDedupe(t, { keyColumns: [0, 1], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 1);
});

test("dedupe: case-insensitive keys by default", () => {
  const t = table("id,name\nabc,x\nABC,y\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 1);
});

test("dedupe: case-sensitive mode keeps both", () => {
  const t = table("id,name\nabc,x\nABC,y\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: true, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 0);
});

test("dedupe: trimmed keys match (whitespace-insensitive)", () => {
  const t = table("id,name\n 1 ,x\n1,y\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 1);
});

test("dedupe: original table is not mutated", () => {
  const t = table("id,name\n1,A\n1,A\n");
  const before = t.rows.length;
  planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(t.rows.length, before);
});

test("dedupe: duplicate groups reported", () => {
  const t = table("id,name\n1,A\n1,B\n2,C\n2,D\n2,E\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.groups.length, 2);
  assert.equal(plan.groups[1].rowNumbers.length, 3);
});

test("dedupe: no duplicates → empty drop list", () => {
  const t = table("id,name\n1,A\n2,B\n3,C\n");
  const plan = planDedupe(t, { keyColumns: [0], keepRule: "first", trimKeys: true, caseSensitive: false, emptyTokensEqual: false });
  assert.equal(plan.dropIndices.length, 0);
  assert.equal(plan.groups.length, 0);
});
