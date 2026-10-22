import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTableFromText } from "../src/format/csv.js";
import { decodeBytes } from "../src/format/csv.js";
import { sniffEncoding } from "../src/core/normalize.js";

test("parse: basic CSV", () => {
  const t = parseTableFromText("a,b,c\n1,2,3\n4,5,6\n", { delimiter: "auto" });
  assert.deepEqual(t.headers, ["a", "b", "c"]);
  assert.equal(t.rows.length, 2);
  assert.deepEqual(t.rows[0], ["1", "2", "3"]);
  assert.deepEqual(t.sourceRowNumbers, [1, 2]);
});

test("parse: quoted fields with commas and newlines", () => {
  const text = 'name,note\n"Smith, John","line1\nline2"\n';
  const t = parseTableFromText(text, { delimiter: "," });
  assert.equal(t.rows.length, 1);
  assert.equal(t.rows[0][0], "Smith, John");
  assert.equal(t.rows[0][1], "line1\nline2");
});

test("parse: semicolon, tab, pipe delimiters", () => {
  const semi = parseTableFromText("a;b\n1;2\n", { delimiter: ";" });
  assert.deepEqual(semi.headers, ["a", "b"]);
  const tab = parseTableFromText("a\tb\n1\t2\n", { delimiter: "\t" });
  assert.deepEqual(tab.headers, ["a", "b"]);
  const pipe = parseTableFromText("a|b\n1|2\n", { delimiter: "|" });
  assert.deepEqual(pipe.headers, ["a", "b"]);
});

test("parse: empty file throws EMPTY_FILE", () => {
  assert.throws(() => parseTableFromText("", { delimiter: "auto" }), /EMPTY_FILE|empty/i);
  assert.throws(() => parseTableFromText("   \n\n", { delimiter: "auto" }), /EMPTY_FILE|empty/i);
});

test("parse: duplicate headers renamed", () => {
  const t = parseTableFromText("id,id\n1,2\n", { delimiter: "," });
  assert.deepEqual(t.headers, ["id", "id (2)"]);
  assert.ok(t.notices.some((n) => /Duplicate column names/i.test(n)));
});

test("parse: leading zeros preserved", () => {
  const t = parseTableFromText("zip,name\n00123,Ann\n01000,Bob\n", { delimiter: "," });
  assert.equal(t.rows[0][0], "00123");
  assert.equal(t.rows[1][0], "01000");
});

test("parse: unicode text preserved", () => {
  const t = parseTableFromText("name\nJosé\nМосква\n😀\n", { delimiter: "," });
  assert.equal(t.rows[0][0], "José");
  assert.equal(t.rows[1][0], "Москва");
  assert.equal(t.rows[2][0], "😀");
});

test("parse: CR-only line endings", () => {
  const t = parseTableFromText("a,b\r1,2\r3,4\r", { delimiter: "," });
  assert.equal(t.rows.length, 2);
  assert.deepEqual(t.rows[0], ["1", "2"]);
});

test("parse: BOM stripped", () => {
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62, 0x0a, 0x31, 0x2c, 0x32]);
  const text = decodeBytes(bytes);
  const t = parseTableFromText(text, { delimiter: "," });
  assert.deepEqual(t.headers, ["a", "b"]);
});

test("parse: header-only file is valid (zero rows)", () => {
  const t = parseTableFromText("a,b\n", { delimiter: "," });
  assert.equal(t.rows.length, 0);
  assert.deepEqual(t.headers, ["a", "b"]);
});

test("sniffEncoding: utf-8 BOM", () => {
  const b = new Uint8Array([0xef, 0xbb, 0xbf, 0x61]);
  assert.equal(sniffEncoding(b), "utf-8");
});

test("sniffEncoding: utf-16le BOM", () => {
  const b = new Uint8Array([0xff, 0xfe, 0x61, 0x00]);
  assert.equal(sniffEncoding(b), "utf-16le");
});

test("parse: row with more cells than header keeps extra (no data loss)", () => {
  const t = parseTableFromText("a,b\n1,2,3,4\n", { delimiter: "," });
  assert.equal(t.rows[0].length, 4);
  assert.equal(t.rows[0][2], "3");
});
