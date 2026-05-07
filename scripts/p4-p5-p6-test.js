import assert from "node:assert/strict";

import { AssetStore } from "../public/core/asset-store.js";
import { createDocumentModel, createHeading, createParagraph, createTable } from "../public/core/document-model.js";
import { getAllowedOutputFormats, getFormatCapabilities, convertContent } from "../public/browser-transformer.js";
import {
  createFixturePluginPackage,
  createPluginRecord,
  runPluginModuleTask,
  setPluginEnabled,
} from "../public/core/plugin-runtime.js";
import { readZipEntries } from "../public/core/zip-container.js";

await testAssetLazyLoad();
testCapabilityNotes();
await testFixturePluginLoader();
testEnhancedOutputs();
testOfdL0Reader();

async function testAssetLazyLoad() {
  let loads = 0;
  const store = new AssetStore();
  const asset = store.addLazy({
    id: "image-1",
    name: "figure.png",
    mime: "image/png",
    size: 12,
    role: "image",
    load: async () => {
      loads += 1;
      return "data:image/png;base64,AAAA";
    },
  });

  assert.equal(asset.loaded, false);
  assert.equal(loads, 0);
  assert.equal(store.list()[0].data, "");

  const resolved = await store.resolve("image-1");
  assert.equal(loads, 1);
  assert.equal(resolved.loaded, true);
  assert.equal(resolved.data, "data:image/png;base64,AAAA");

  await store.resolve("image-1");
  assert.equal(loads, 1, "lazy assets should be cached after the first preview/export load");
}

function testCapabilityNotes() {
  const heavyFormats = new Map(getFormatCapabilities().map((item) => [item.format, item]));
  for (const format of ["docx", "xlsx", "pptx", "epub", "pdf"]) {
    const capability = heavyFormats.get(format);
    assert.equal(Boolean(capability), true, `${format} should be registered`);
    assert.match(capability.qualityGrade, /^(basic|enhanced|plugin-required)$/);
    assert.equal(Array.isArray(capability.warnings), true);
    assert.equal(typeof capability.resourceBudget.maxInputBytes, "number");
    assert.equal(typeof capability.degradation, "string");
  }
}

async function testFixturePluginLoader() {
  const fixture = await createFixturePluginPackage();
  const enabled = setPluginEnabled(createPluginRecord(fixture.manifest, { integrityVerified: true }), true);

  const success = await runPluginModuleTask(enabled, {
    packageBytes: fixture.bytes,
    input: { text: "local content" },
    timeoutMs: 1000,
  });
  assert.equal(success.ok, true);
  assert.equal(success.output.blocks[0].text.includes("fixture plugin processed"), true);

  const network = await runPluginModuleTask(enabled, {
    packageBytes: fixture.bytes,
    input: { mode: "network" },
    timeoutMs: 1000,
  });
  assert.equal(network.ok, false);
  assert.equal(network.error.code, "PLUGIN_NETWORK_BLOCKED");
  assert.equal(network.outputPreserved, true);

  const crash = await runPluginModuleTask(enabled, {
    packageBytes: fixture.bytes,
    input: { mode: "crash" },
    timeoutMs: 1000,
  });
  assert.equal(crash.ok, false);
  assert.equal(crash.error.code, "PLUGIN_CRASH_ISOLATED");
}

function testEnhancedOutputs() {
  const model = createDocumentModel({
    title: "High fidelity sample",
    sourceFormat: "md",
    blocks: [
      createHeading(1, "Report"),
      createParagraph("See https://example.com for details."),
      createTable(["A", "B"], [["1", "2"], ["3", "4"]]),
      ...Array.from({ length: 70 }, (_, index) => createParagraph(`Long paragraph ${index + 1}`)),
    ],
  });

  const docx = convertContent({ content: JSON.stringify(model), from: "json", to: "docx", title: "sample.docx" });
  const docxZip = readZipEntries(docx.data);
  assert.equal(Boolean(docxZip.getText("word/styles.xml")), true);
  assert.equal(Boolean(docxZip.getText("word/numbering.xml")), true);
  assert.match(docxZip.getText("word/document.xml"), /<w:tblW\b/);
  assert.match(docxZip.getText("word/document.xml"), /<w:pgSz\b/);

  const pdf = convertContent({ content: JSON.stringify(model), from: "json", to: "pdf", title: "sample.pdf" });
  const pdfText = Buffer.from(pdf.data.split(",")[1], "base64").toString("latin1");
  assert.match(pdfText, /\/Count [2-9]/, "long PDFs should paginate");
  assert.match(pdfText, /\/Annots \[/, "PDF links should create annotations");

  assert.equal(getAllowedOutputFormats("json").includes("png"), false, "PNG output stays hidden until real document rendering is available");
  assert.equal(getAllowedOutputFormats("json").includes("jpeg"), false, "JPEG output stays hidden until real document rendering is available");
}

function testOfdL0Reader() {
  const ofdXml = `<?xml version="1.0" encoding="UTF-8"?><ofd:OFD xmlns:ofd="http://www.ofdspec.org/2016"><ofd:DocBody><ofd:DocInfo><ofd:DocID>demo</ofd:DocID><ofd:Title>公开样例</ofd:Title></ofd:DocInfo><ofd:DocRoot>Doc_0/Document.xml</ofd:DocRoot></ofd:DocBody></ofd:OFD>`;
  const result = convertContent({ content: ofdXml, from: "ofd", to: "json", title: "sample.ofd" });
  const model = JSON.parse(result.data);
  assert.equal(model.sourceFormat, "ofd");
  assert.equal(model.metadata.ofd.level, "L0");
  assert.equal(model.metadata.warnings.some((warning) => warning.code === "OFD_L1_PLUGIN_REQUIRED"), true);
}

console.log("P4/P5/P6 test passed: lazy assets, quality capabilities, fixture plugin loader, enhanced outputs, and OFD L0 are covered.");
