import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  convertContent,
  listFormats,
  renderPreviewHtml,
  toDocumentModel,
} from "../public/browser-transformer.js";
import { ConversionError, normalizeConversionError } from "../public/core/conversion-error.js";
import { assertValidDocumentModel, validateDocumentModel } from "../public/core/document-schema.js";

const SAMPLE_ROOT = path.resolve("samples");
const INPUT_FORMATS = ["md", "html", "txt", "json", "csv", "xml", "png"];
const OUTPUT_FORMATS = ["md", "html", "txt", "json", "csv", "xml", "pdf"];
const TEXT_OUTPUT_FORMATS = ["md", "html", "txt", "json", "xml", "pdf"];
const EXPECTED_BLOCK_TYPES = ["heading", "paragraph", "list", "code", "table", "quote", "image", "asset", "raw"];

const SAMPLE_MATRIX = {
  md: ["chinese.md", "table-code.md", "image-link.md"],
  html: ["article.html", "table-list.html", "inline-media.html"],
  txt: ["chinese.txt", "long-lines.txt", "code-list.txt"],
  json: ["object.json", "array.json", "document-model.json"],
  csv: ["basic.csv", "quoted.csv", "unicode.csv"],
  xml: ["basic.xml", "attributes.xml", "namespace.xml"],
  png: ["tiny-red.data-url.txt", "tiny-green.data-url.txt", "tiny-blue.data-url.txt"],
};

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  for (const { name, fn } of tests) {
    await fn();
    console.log(`ok - ${name}`);
  }
  console.log(`Smoke test passed: ${tests.length} test groups completed.`);
}

async function readSample(format, fileName) {
  return readFile(path.join(SAMPLE_ROOT, format, fileName), "utf8");
}

async function readSamples() {
  const samples = [];
  for (const [format, fileNames] of Object.entries(SAMPLE_MATRIX)) {
    for (const fileName of fileNames) {
      samples.push({
        format,
        fileName,
        content: await readSample(format, fileName),
      });
    }
  }
  return samples;
}

function assertValidOutput(result, toFormat, label) {
  assert.equal(result.format, toFormat, `${label} should output ${toFormat}`);
  assert.equal(typeof result.data, "string", `${label} should return string data`);
  assert.equal(result.data.trim().length > 0, true, `${label} should not return empty data`);
  if (toFormat === "pdf") {
    assert.equal(result.type, "print", `${label} should use print output for PDF`);
    assert.equal(result.data.includes("@media print"), true, `${label} PDF-print output should include print CSS`);
  } else {
    assert.equal(result.type, "text", `${label} should use text output`);
  }
}

test("format registry exposes the supported input and output matrix", () => {
  const formats = listFormats();
  assert.deepEqual(formats.input, INPUT_FORMATS);
  assert.deepEqual(formats.output, OUTPUT_FORMATS);
});

test("DocumentModel validation accepts generated models and rejects invalid models", () => {
  const markdown = "# Title\n\nHello **Trans2Former**.\n\n- One\n- Two\n\n```js\nconsole.log('ok');\n```";
  const model = toDocumentModel(markdown, "md", "sample");
  assert.equal(model.schemaVersion, "trans2former.document.v1");
  assert.equal(model.blocks[0].type, "heading");
  assert.equal(model.blocks[0].text, "Title");
  assert.equal(validateDocumentModel(model).ok, true);
  assert.doesNotThrow(() => assertValidDocumentModel(model));
  assert.throws(() => assertValidDocumentModel({ schemaVersion: "bad", blocks: [] }), /schema validation failed/);
});

test("ConversionError normalizes parse, validate, and convert failures", () => {
  assert.throws(
    () => convertContent({ content: "{", from: "json", to: "md", title: "invalid" }),
    (error) => error instanceof ConversionError
      && error.category === "parse"
      && error.code === "JSON_PARSE_ERROR"
      && error.format === "json"
  );

  assert.throws(
    () => assertValidDocumentModel({ schemaVersion: "bad", blocks: [] }),
    (error) => error instanceof ConversionError
      && error.category === "validate"
      && error.code === "DOCUMENT_MODEL_SCHEMA_ERROR"
  );

  assert.throws(
    () => convertContent({ content: "# Title", from: "md", to: "docx", title: "unsupported" }),
    (error) => error instanceof ConversionError
      && error.category === "convert"
      && error.code === "UNSUPPORTED_OUTPUT_FORMAT"
      && error.format === "docx"
  );

  const normalized = normalizeConversionError(new Error("plain failure"), {
    category: "render",
    code: "PREVIEW_RENDER_ERROR",
  });
  assert.equal(normalized instanceof ConversionError, true);
  assert.equal(normalized.category, "render");
  assert.equal(normalized.code, "PREVIEW_RENDER_ERROR");
});

test("Markdown preview and core conversions preserve common document structure", () => {
  const markdown = "# Title\n\nHello **Trans2Former**.\n\n- One\n- Two\n\n```js\nconsole.log('ok');\n```";
  const preview = renderPreviewHtml(markdown, "md", "sample");
  assert.equal(preview.includes("<h1>Title</h1>"), true);
  assert.equal(preview.includes("<strong>Trans2Former</strong>"), true);

  const html = convertContent({ content: markdown, from: "md", to: "html", title: "sample" });
  assertValidOutput(html, "html", "markdown to html");
  assert.equal(html.data.includes("<main>"), true);

  const text = convertContent({ content: "<h1>Hello</h1><p>World</p>", from: "html", to: "txt", title: "sample" });
  assertValidOutput(text, "txt", "html to txt");
  assert.equal(text.data.includes("Hello"), true);
  assert.equal(text.data.includes("World"), true);

  const json = convertContent({ content: "{\"hello\":\"world\"}", from: "json", to: "md", title: "sample" });
  assertValidOutput(json, "md", "json to markdown");
  assert.equal(json.data.includes("```json"), true);
});

test("JSON output wraps a DocumentModel with markdown and plain text projections", () => {
  const markdown = "# Title\n\nHello **Trans2Former**.";
  const jsonDocument = convertContent({ content: markdown, from: "md", to: "json", title: "sample" });
  assertValidOutput(jsonDocument, "json", "markdown to json");
  const parsedDocumentJson = JSON.parse(jsonDocument.data);
  assert.equal(parsedDocumentJson.schemaVersion, "trans2former.document.v1");
  assert.equal(Array.isArray(parsedDocumentJson.blocks), true);
  assert.equal(parsedDocumentJson.blocks[0].type, "heading");
  assert.equal(parsedDocumentJson.blocks[0].text, "Title");
  assert.equal(parsedDocumentJson.markdown.includes("# Title"), true);
});

test("table conversions round-trip through Markdown, CSV, and HTML", () => {
  const tableMarkdown = "| Name | Value |\n| --- | --- |\n| A | 1 |\n| B | 2 |";
  const tableModel = toDocumentModel(tableMarkdown, "md", "table");
  assert.equal(tableModel.blocks[0].type, "table");
  assert.deepEqual(tableModel.blocks[0].headers, ["Name", "Value"]);
  assert.deepEqual(tableModel.blocks[0].rows[1], ["B", "2"]);

  const tableHtml = convertContent({ content: tableMarkdown, from: "md", to: "html", title: "table" });
  assertValidOutput(tableHtml, "html", "markdown table to html");
  assert.equal(tableHtml.data.includes("<table>"), true);

  const tableRoundTrip = convertContent({ content: tableMarkdown, from: "md", to: "md", title: "table" });
  assertValidOutput(tableRoundTrip, "md", "markdown table round-trip");
  assert.equal(tableRoundTrip.data.includes("| Name | Value |"), true);

  const csvContent = "Name,Value\nA,1\nB,2";
  const csvModel = toDocumentModel(csvContent, "csv", "csv");
  assert.equal(csvModel.blocks[0].type, "table");
  assert.deepEqual(csvModel.blocks[0].headers, ["Name", "Value"]);

  const csvToMarkdown = convertContent({ content: csvContent, from: "csv", to: "md", title: "csv" });
  assertValidOutput(csvToMarkdown, "md", "csv to markdown");
  assert.equal(csvToMarkdown.data.includes("| Name | Value |"), true);

  const markdownToCsv = convertContent({ content: tableMarkdown, from: "md", to: "csv", title: "table" });
  assertValidOutput(markdownToCsv, "csv", "markdown to csv");
  assert.equal(markdownToCsv.data.includes("Name,Value"), true);
});

test("XML and PNG inputs convert through the DocumentModel pipeline", () => {
  const xmlContent = "<root><item>A</item><item>B</item></root>";
  const xmlModel = toDocumentModel(xmlContent, "xml", "xml");
  assert.equal(validateDocumentModel(xmlModel).ok, true);

  const markdown = "# Title\n\nHello **Trans2Former**.";
  const markdownToXml = convertContent({ content: markdown, from: "md", to: "xml", title: "sample" });
  assertValidOutput(markdownToXml, "xml", "markdown to xml");
  assert.equal(markdownToXml.data.includes("<document"), true);
  assert.equal(markdownToXml.data.includes("<heading level=\"1\">Title</heading>"), true);

  const pngData = "data:image/png;base64,iVBORw0KGgo=";
  const pngModel = toDocumentModel(pngData, "png", "tiny");
  assert.equal(pngModel.assets.length, 1);
  assert.equal(pngModel.blocks.some((block) => block.type === "asset"), true);
  assert.equal(validateDocumentModel(pngModel).ok, true);

  const pngHtml = convertContent({ content: pngData, from: "png", to: "html", title: "tiny", fileName: "tiny.png" });
  assertValidOutput(pngHtml, "html", "png to html");
  assert.equal(pngHtml.data.includes("data:image/png;base64"), true);

  const pdf = convertContent({ content: markdown, from: "md", to: "pdf", title: "sample" });
  assertValidOutput(pdf, "pdf", "markdown to pdf-print");
});

test("sample fixtures exist and parse into valid DocumentModels", async () => {
  const samples = await readSamples();
  assert.equal(samples.length, INPUT_FORMATS.length * 3);

  for (const [format, fileNames] of Object.entries(SAMPLE_MATRIX)) {
    assert.equal(fileNames.length >= 3, true, `${format} should have at least three samples`);
  }

  for (const sample of samples) {
    const label = `${sample.format}/${sample.fileName}`;
    assert.equal(sample.content.trim().length > 0, true, `${label} should not be empty`);
    const model = toDocumentModel(sample.content.trimEnd(), sample.format, sample.fileName);
    assert.equal(validateDocumentModel(model).ok, true, `${label} should produce a valid DocumentModel`);
  }
});

test("sample fixtures convert to common text outputs with explicit degradation paths", async () => {
  const samples = await readSamples();
  for (const sample of samples) {
    for (const toFormat of TEXT_OUTPUT_FORMATS) {
      const label = `${sample.format}/${sample.fileName} -> ${toFormat}`;
      const result = convertContent({
        content: sample.content.trimEnd(),
        from: sample.format,
        to: toFormat,
        title: sample.fileName,
        fileName: sample.fileName,
      });
      assertValidOutput(result, toFormat, label);
    }
  }
});

test("machine-readable DocumentModel schema mirrors the runtime block and asset shapes", async () => {
  const schemaPath = path.resolve("docs", "document-model.schema.json");
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  assert.equal(schema.$id, "https://vantalens.github.io/trans2former/document-model.schema.json");
  assert.equal(schema.properties.schemaVersion.const, "trans2former.document.v1");
  assert.deepEqual(schema.properties.blocks.items.oneOf.map((entry) => entry.properties.type.const), EXPECTED_BLOCK_TYPES);
  assert.deepEqual(Object.keys(schema.properties.assets.items.properties), ["id", "name", "mime", "data", "size", "role"]);
});

await runTests();
