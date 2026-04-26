import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { convertContent } from "../public/browser-transformer.js";

const SNAPSHOT_ROOT = path.resolve("tests", "snapshots", "conversions");

const SNAPSHOT_CASES = [
  {
    name: "markdown table and code round-trip",
    snapshot: "md-table-roundtrip.md",
    inputPath: path.resolve("samples", "md", "table-code.md"),
    from: "md",
    to: "md",
  },
  {
    name: "quoted CSV round-trip",
    snapshot: "csv-quoted-roundtrip.csv",
    inputPath: path.resolve("samples", "csv", "quoted.csv"),
    from: "csv",
    to: "csv",
  },
  {
    name: "PNG input degrades to readable text",
    snapshot: "png-to-txt-degraded.txt",
    inputPath: path.resolve("samples", "png", "tiny-red.data-url.txt"),
    from: "png",
    to: "txt",
  },
  {
    name: "XML attributes degrade to Markdown text",
    snapshot: "xml-attributes-to-md.md",
    inputPath: path.resolve("samples", "xml", "attributes.xml"),
    from: "xml",
    to: "md",
  },
  {
    name: "empty Markdown produces empty DocumentModel JSON",
    snapshot: "empty-md-to-json.json",
    content: "",
    fileName: "empty.md",
    from: "md",
    to: "json",
  },
];

const ERROR_CASES = [
  {
    name: "invalid JSON reports a parse error",
    payload: { content: "{", from: "json", to: "md", title: "invalid.json", fileName: "invalid.json" },
    messagePattern: /JSON 解析失败/,
  },
  {
    name: "unsupported output format reports capability error",
    payload: { content: "# Title", from: "md", to: "docx", title: "unsupported.md", fileName: "unsupported.md" },
    messagePattern: /输出格式不支持: docx/,
  },
];

function normalizeSnapshot(value) {
  return String(value).replace(/\r\n/g, "\n");
}

async function readCaseContent(testCase) {
  if (Object.hasOwn(testCase, "content")) {
    return testCase.content;
  }
  return readFile(testCase.inputPath, "utf8");
}

for (const testCase of SNAPSHOT_CASES) {
  const content = await readCaseContent(testCase);
  const fileName = testCase.fileName || path.basename(testCase.inputPath);
  const result = convertContent({
    content: normalizeSnapshot(content).trimEnd(),
    from: testCase.from,
    to: testCase.to,
    title: fileName,
    fileName,
  });
  const expected = await readFile(path.join(SNAPSHOT_ROOT, testCase.snapshot), "utf8");
  assert.equal(
    normalizeSnapshot(result.data),
    normalizeSnapshot(expected),
    `${testCase.name} should match ${testCase.snapshot}`
  );
}

for (const testCase of ERROR_CASES) {
  assert.throws(
    () => convertContent(testCase.payload),
    testCase.messagePattern,
    testCase.name
  );
}

console.log(`Snapshot test passed: ${SNAPSHOT_CASES.length} snapshots and ${ERROR_CASES.length} error cases completed.`);
