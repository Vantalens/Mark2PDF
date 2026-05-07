#!/usr/bin/env node
import assert from "node:assert/strict";

import { convertContent } from "../public/browser-transformer.js";
import { normalizeWorkerPayload } from "../public/workers/convert-worker.js";

function toBufferPayload(content, extra = {}) {
  const bytes = new TextEncoder().encode(content);
  return {
    content: "",
    contentBuffer: bytes.buffer,
    contentEncoding: "utf-8",
    ...extra,
  };
}

const largeChineseText = `标题\n\n中文内容不应在 Worker transfer 后乱码。\n${"段落内容\n".repeat(12000)}`;
const normalizedText = normalizeWorkerPayload(toBufferPayload(largeChineseText, {
  from: "txt",
  to: "md",
  fileName: "large.txt",
}));
assert.equal(normalizedText.content.includes("中文内容不应"), true);
assert.equal(/[�ï¿½]/.test(normalizedText.content), false);
assert.equal(normalizedText.contentBuffer, undefined);

const docx = convertContent({
  content: "# 标题\n\n中文 DOCX 内容",
  from: "md",
  to: "docx",
  title: "worker-docx.docx",
});
const normalizedDocx = normalizeWorkerPayload(toBufferPayload(docx.data, {
  from: "docx",
  to: "txt",
  fileName: "worker-docx.docx",
}));
assert.equal(normalizedDocx.content.startsWith("data:"), true, "binary inputs travel through Worker as data URLs, not decoded ZIP bytes");

const docxText = convertContent(normalizedDocx);
assert.match(docxText.data, /中文 DOCX 内容/, "Worker-normalized DOCX data URL should still parse and preserve text");

console.log("Worker payload test passed: transferable text and binary data URLs survive Worker normalization.");
