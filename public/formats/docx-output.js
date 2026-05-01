import { bytesToDataUrl, textToBytes } from "../core/binary-utils.js";
import { writeStoredZip } from "../core/zip-writer.js";
import { escapeHtml } from "./text-utils.js";

const NS = "http" + "://schemas.openxmlformats.org";
const DC_NS = "http" + "://purl.org/dc/elements/1.1/";

function xmlText(value) {
  return escapeHtml(String(value ?? ""));
}

function paragraph(text) {
  return `<w:p><w:r><w:t>${xmlText(text)}</w:t></w:r></w:p>`;
}

function heading(block) {
  return `<w:p><w:pPr><w:pStyle w:val="Heading${block.level}"/></w:pPr><w:r><w:t>${xmlText(block.text)}</w:t></w:r></w:p>`;
}

function table(block) {
  const rows = [block.headers, ...(block.rows || [])];
  return `<w:tbl>${rows.map((row) => `<w:tr>${row.map((cell) => `<w:tc>${paragraph(cell)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`;
}

function blockToWordXml(block) {
  if (block.type === "heading") return heading(block);
  if (block.type === "paragraph" || block.type === "quote") return paragraph(block.text);
  if (block.type === "list") return (block.items || []).map((item, index) => paragraph(`${block.ordered ? `${index + 1}.` : "-"} ${item}`)).join("");
  if (block.type === "code") return paragraph(block.code);
  if (block.type === "table") return table(block);
  if (block.type === "image") return paragraph(block.alt || block.title || block.src);
  if (block.type === "asset") return paragraph(block.alt || block.title || block.assetId);
  if (block.type === "raw") return paragraph(block.content);
  return "";
}

export function writeDocx({ model, title = model.title }) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS}/wordprocessingml/2006/main">
  <w:body>
    ${model.blocks.map(blockToWordXml).join("\n")}
    <w:sectPr/>
  </w:body>
</w:document>`;
  const zipBytes = writeStoredZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="${NS}/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="${NS}/package/2006/relationships">
  <Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="${NS}/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/core.xml",
      data: `<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="${NS}/package/2006/metadata/core-properties" xmlns:dc="${DC_NS}"><dc:title>${xmlText(title)}</dc:title></cp:coreProperties>`,
    },
    { name: "word/document.xml", data: textToBytes(documentXml) },
  ]);
  return {
    type: "binary",
    format: "docx",
    data: bytesToDataUrl(zipBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}
