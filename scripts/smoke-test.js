import assert from "node:assert/strict";

import {
  convertContent,
  listFormats,
  renderPreviewHtml,
  toDocumentModel,
} from "../public/browser-transformer.js";
import { assertValidDocumentModel, validateDocumentModel } from "../public/core/document-schema.js";

const formats = listFormats();
assert.deepEqual(formats.input, ["md", "html", "txt", "json", "csv", "xml", "png"]);
assert.deepEqual(formats.output, ["md", "html", "txt", "json", "csv", "xml", "pdf"]);

const markdown = "# Title\n\nHello **Trans2Former**.\n\n- One\n- Two\n\n```js\nconsole.log('ok');\n```";
const model = toDocumentModel(markdown, "md", "sample");
assert.equal(model.schemaVersion, "trans2former.document.v1");
assert.equal(model.blocks[0].type, "heading");
assert.equal(model.blocks[0].text, "Title");
assert.equal(validateDocumentModel(model).ok, true);
assert.doesNotThrow(() => assertValidDocumentModel(model));

const preview = renderPreviewHtml(markdown, "md", "sample");
assert.equal(preview.includes("<h1>Title</h1>"), true);
assert.equal(preview.includes("<strong>Trans2Former</strong>"), true);

const html = convertContent({ content: markdown, from: "md", to: "html", title: "sample" });
assert.equal(html.type, "text");
assert.equal(html.format, "html");
assert.equal(html.data.includes("<main>"), true);

const text = convertContent({ content: "<h1>Hello</h1><p>World</p>", from: "html", to: "txt", title: "sample" });
assert.equal(text.type, "text");
assert.equal(text.format, "txt");
assert.equal(text.data.includes("Hello"), true);
assert.equal(text.data.includes("World"), true);

const json = convertContent({ content: "{\"hello\":\"world\"}", from: "json", to: "md", title: "sample" });
assert.equal(json.format, "md");
assert.equal(json.data.includes("```json"), true);


const pngData = "data:image/png;base64,iVBORw0KGgo=";
const pngModel = toDocumentModel(pngData, "png", "tiny");
assert.equal(pngModel.assets.length, 1);
assert.equal(pngModel.blocks.some((block) => block.type === "asset"), true);
assert.equal(validateDocumentModel(pngModel).ok, true);
const pngHtml = convertContent({ content: pngData, from: "png", to: "html", title: "tiny", fileName: "tiny.png" });
assert.equal(pngHtml.data.includes("data:image/png;base64"), true);
const pdf = convertContent({ content: markdown, from: "md", to: "pdf", title: "sample" });
assert.equal(pdf.type, "print");
assert.equal(pdf.format, "pdf");
assert.equal(pdf.data.includes("@media print"), true);

console.log("Smoke test passed: browser DocumentModel conversion pipeline is healthy.");

const jsonDocument = convertContent({ content: markdown, from: "md", to: "json", title: "sample" });
const parsedDocumentJson = JSON.parse(jsonDocument.data);
assert.equal(parsedDocumentJson.schemaVersion, "trans2former.document.v1");
assert.equal(Array.isArray(parsedDocumentJson.blocks), true);
assert.equal(parsedDocumentJson.blocks[0].type, "heading");
assert.equal(parsedDocumentJson.blocks[0].text, "Title");
assert.equal(parsedDocumentJson.markdown.includes("# Title"), true);

assert.throws(() => assertValidDocumentModel({ schemaVersion: "bad", blocks: [] }), /schema validation failed/);
const tableMarkdown = "| Name | Value |\n| --- | --- |\n| A | 1 |\n| B | 2 |";
const tableModel = toDocumentModel(tableMarkdown, "md", "table");
assert.equal(tableModel.blocks[0].type, "table");
assert.deepEqual(tableModel.blocks[0].headers, ["Name", "Value"]);
assert.deepEqual(tableModel.blocks[0].rows[1], ["B", "2"]);
const tableHtml = convertContent({ content: tableMarkdown, from: "md", to: "html", title: "table" });
assert.equal(tableHtml.data.includes("<table>"), true);
const tableRoundTrip = convertContent({ content: tableMarkdown, from: "md", to: "md", title: "table" });
assert.equal(tableRoundTrip.data.includes("| Name | Value |"), true);
const csvContent = "Name,Value\nA,1\nB,2";
const csvModel = toDocumentModel(csvContent, "csv", "csv");
assert.equal(csvModel.blocks[0].type, "table");
assert.deepEqual(csvModel.blocks[0].headers, ["Name", "Value"]);
const csvToMarkdown = convertContent({ content: csvContent, from: "csv", to: "md", title: "csv" });
assert.equal(csvToMarkdown.data.includes("| Name | Value |"), true);
const markdownToCsv = convertContent({ content: tableMarkdown, from: "md", to: "csv", title: "table" });
assert.equal(markdownToCsv.data.includes("Name,Value"), true);

const xmlContent = "<root><item>A</item><item>B</item></root>";
const xmlModel = toDocumentModel(xmlContent, "xml", "xml");
assert.equal(validateDocumentModel(xmlModel).ok, true);
const markdownToXml = convertContent({ content: markdown, from: "md", to: "xml", title: "sample" });
assert.equal(markdownToXml.data.includes("<document"), true);
assert.equal(markdownToXml.data.includes("<heading level=\"1\">Title</heading>"), true);