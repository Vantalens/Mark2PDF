#!/usr/bin/env node
import assert from "node:assert/strict";

import {
  convertContent,
  getAllowedOutputFormats,
  getOutputExtension,
  listFormats,
} from "../public/browser-transformer.js";
import { readZipEntries } from "../public/core/zip-container.js";

const textFixture = `# 标题

中文测试内容

| 字段 | 值 |
| --- | --- |
| 城市 | 上海 |
| 状态 | 正常 |
`;

const csvFixture = "字段,值\n城市,上海\n状态,正常\n";
const jsonFixture = JSON.stringify({
  title: "标题",
  blocks: [
    { type: "heading", level: 1, text: "标题" },
    { type: "paragraph", text: "中文测试内容" },
    { type: "table", headers: ["字段", "值"], rows: [["城市", "上海"], ["状态", "正常"]] },
  ],
});

const sourceByFormat = {
  md: textFixture,
  html: `<!doctype html><meta charset="utf-8"><h1>标题</h1><p>中文测试内容</p><table><tr><th>字段</th><th>值</th></tr><tr><td>城市</td><td>上海</td></tr></table>`,
  txt: "标题\n\n中文测试内容\n城市 上海\n",
  csv: csvFixture,
  json: jsonFixture,
  xml: '<?xml version="1.0" encoding="UTF-8"?><root><title>标题</title><p>中文测试内容</p></root>',
};

function bytesFromDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/);
  assert.ok(match, "binary outputs must be base64 data URLs with a concrete MIME type");
  return {
    mime: match[1],
    bytes: new Uint8Array(Buffer.from(match[2], "base64")),
  };
}

function assertZipOutput(result, requiredEntries, { ooxml = false } = {}) {
  const { bytes } = bytesFromDataUrl(result.data);
  assert.equal(bytes[0], 0x50, `${result.format} must start with ZIP local file header`);
  assert.equal(bytes[1], 0x4b, `${result.format} must start with ZIP local file header`);
  const zip = readZipEntries(result.data);
  for (const entry of requiredEntries) {
    assert.equal(zip.has(entry), true, `${result.format} missing ${entry}`);
  }
  if (ooxml) {
    assert.equal(zip.has("[Content_Types].xml"), true, `${result.format} missing content types`);
  }
  return zip;
}

function assertPdfOutput(result) {
  const { mime, bytes } = bytesFromDataUrl(result.data);
  assert.equal(mime, "application/pdf");
  const pdfText = Buffer.from(bytes).toString("latin1");
  assert.equal(pdfText.startsWith("%PDF-"), true, "PDF must start with a PDF header");
  assert.match(pdfText, /\/Type0|\/CIDFontType0|\/UniGB-UCS2-H/, "PDF must use a Unicode/CJK-capable font path");
  assert.match(pdfText, /\/Title <FEFF/, "PDF metadata title must use UTF-16BE hex to avoid mojibake in browser viewers");
  assert.doesNotMatch(pdfText, /\/Title \([^)]*[\x80-\xff]/, "PDF title must not write non-ASCII text as a literal string");
  assert.match(pdfText, /%%EOF\s*$/, "PDF must end with EOF marker");
}

function assertImageOutputNotExposed(from, to) {
  assert.equal(
    getAllowedOutputFormats(from).includes(to),
    false,
    `${from} -> ${to} must stay hidden until visual rendering preserves document content`
  );
}

const requiredZipEntries = {
  docx: ["word/document.xml", "word/styles.xml", "word/_rels/document.xml.rels", "docProps/core.xml"],
  xlsx: ["xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/sharedStrings.xml", "xl/styles.xml", "docProps/core.xml"],
  epub: ["mimetype", "META-INF/container.xml", "OEBPS/content.opf", "OEBPS/chapter.xhtml"],
  pptx: [
    "ppt/presentation.xml",
    "ppt/slides/slide1.xml",
    "ppt/slides/_rels/slide1.xml.rels",
    "ppt/slideMasters/slideMaster1.xml",
    "ppt/slideLayouts/slideLayout1.xml",
    "ppt/theme/theme1.xml",
    "docProps/app.xml",
  ],
};

const outputs = listFormats().output;
assert.equal(outputs.includes("jpeg"), false, "JPEG must not be advertised while it is only a placeholder writer");

for (const [from, source] of Object.entries(sourceByFormat)) {
  for (const to of getAllowedOutputFormats(from)) {
    const result = convertContent({ content: source, from, to, title: `case.${from}`, fileName: `case.${from}` });
    assert.equal(result.format, to, `${from} -> ${to} should report target format`);
    assert.equal(getOutputExtension(to).length > 0, true, `${to} must have an extension`);

    if (result.type === "text") {
      assert.equal(/[�ï¿½]/.test(result.data), false, `${from} -> ${to} should not contain mojibake`);
      assert.match(result.data, /标题|中文|字段|城市|上海/, `${from} -> ${to} should preserve readable content`);
    } else {
      if (requiredZipEntries[to]) {
        const zip = assertZipOutput(result, requiredZipEntries[to], { ooxml: ["docx", "xlsx", "pptx"].includes(to) });
        const combinedXml = requiredZipEntries[to].map((entry) => zip.getText(entry)).join("\n");
        assert.match(combinedXml, /标题|中文|字段|城市|上海/, `${from} -> ${to} should preserve content inside package XML`);
      } else if (to === "pdf") {
        assertPdfOutput(result);
      } else {
        throw new Error(`${from} -> ${to} has no strict integrity assertion`);
      }
    }
  }
}

const chinesePdfTitle = convertContent({
  content: textFixture,
  from: "md",
  to: "pdf",
  title: "期中考试备考指导.md",
  fileName: "期中考试备考指导.md",
});
const chinesePdfText = Buffer.from(bytesFromDataUrl(chinesePdfTitle.data).bytes).toString("latin1");
assert.match(
  chinesePdfText,
  /\/Title <FEFF671F4E2D80038BD55907800363075BFC002E006D0064>/,
  "Chinese PDF titles must be encoded as UTF-16BE hex with BOM"
);
assert.equal(chinesePdfText.includes("/Title (期中考试备考指导.md)"), false, "Chinese PDF titles must not be literal strings");

for (const from of ["md", "html", "txt", "json", "xml", "csv", "docx", "xlsx", "epub", "pdf", "pptx", "png"]) {
  assertImageOutputNotExposed(from, "jpeg");
}

assertImageOutputNotExposed("docx", "pptx");
assertImageOutputNotExposed("pdf", "pptx");

console.log("Format integrity test passed: advertised outputs are structurally valid and placeholder visual outputs are hidden.");
