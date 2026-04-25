import { createDocumentModel, createParagraph, createRawBlock } from "../core/document-model.js";
import { escapeHtml, stripHtml } from "./text-utils.js";

function walkXmlNode(node, depth = 0, lines = []) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (text) lines.push(`${"  ".repeat(depth)}${text}`);
    return lines;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return lines;
  }
  lines.push(`${"  ".repeat(depth)}<${node.tagName.toLowerCase()}>`);
  Array.from(node.childNodes).forEach((child) => walkXmlNode(child, depth + 1, lines));
  return lines;
}

export function readXml({ content, title = "xml", format = "xml" }) {
  const source = String(content ?? "");
  if (typeof DOMParser === "undefined") {
    return createDocumentModel({
      title,
      sourceFormat: format,
      blocks: [createParagraph(stripHtml(source))],
      metadata: { rawXml: source },
    });
  }

  const doc = new DOMParser().parseFromString(source, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`XML 解析失败: ${parserError.textContent.trim()}`);
  }
  const text = walkXmlNode(doc.documentElement).join("\n");
  return createDocumentModel({
    title,
    sourceFormat: format,
    blocks: [createRawBlock("xml", source), createParagraph(text)],
    metadata: { rootElement: doc.documentElement.tagName },
  });
}

export function writeXml({ model, title = model.title }) {
  const blocks = model.blocks.map((block, index) => {
    if (block.type === "heading") return `    <heading level="${block.level}">${escapeHtml(block.text)}</heading>`;
    if (block.type === "paragraph") return `    <paragraph>${escapeHtml(block.text)}</paragraph>`;
    if (block.type === "quote") return `    <quote>${escapeHtml(block.text)}</quote>`;
    if (block.type === "code") return `    <code language="${escapeHtml(block.language)}"><![CDATA[${block.code}]]></code>`;
    if (block.type === "table") {
      const header = `      <headers>${block.headers.map((cell) => `<cell>${escapeHtml(cell)}</cell>`).join("")}</headers>`;
      const rows = block.rows.map((row) => `      <row>${row.map((cell) => `<cell>${escapeHtml(cell)}</cell>`).join("")}</row>`).join("\n");
      return `    <table>\n${header}\n${rows}\n    </table>`;
    }
    if (block.type === "image") return `    <image src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" />`;
    if (block.type === "asset") return `    <asset-ref id="${escapeHtml(block.assetId)}" alt="${escapeHtml(block.alt)}" />`;
    if (block.type === "raw") return `    <raw index="${index}" format="${escapeHtml(block.format)}"><![CDATA[${block.content}]]></raw>`;
    return "";
  }).filter(Boolean).join("\n");

  return {
    type: "text",
    format: "xml",
    data: `<?xml version="1.0" encoding="UTF-8"?>\n<document schemaVersion="${model.schemaVersion}" title="${escapeHtml(title)}" sourceFormat="${escapeHtml(model.sourceFormat)}">\n  <blocks>\n${blocks}\n  </blocks>\n</document>\n`,
    mime: "application/xml;charset=utf-8",
  };
}