import {
  createCodeBlock,
  createDocumentModel,
  createHeading,
  createImage,
  createList,
  createParagraph,
  createQuote,
  createRawBlock,
  createTable,
} from "../core/document-model.js";
import { escapeHtml, stripHtml } from "./text-utils.js";
import { modelToBodyHtml } from "./markdown.js";

function readHtmlWithDomParser(content, title, format) {
  const doc = new DOMParser().parseFromString(String(content ?? ""), "text/html");
  doc.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
  const blocks = [];

  function textOf(node) {
    return (node.textContent || "").replace(/\s+/g, " ").trim();
  }

  function pushElement(element) {
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      blocks.push(createHeading(Number(tag.slice(1)), textOf(element)));
      return;
    }
    if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
      const text = textOf(element);
      if (text) blocks.push(createParagraph(text));
      return;
    }
    if (tag === "blockquote") {
      const text = textOf(element);
      if (text) blocks.push(createQuote(text));
      return;
    }
    if (tag === "pre") {
      blocks.push(createCodeBlock(element.textContent.trim()));
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map(textOf)
        .filter(Boolean);
      if (items.length > 0) blocks.push(createList(items, tag === "ol"));
      return;
    }
    if (tag === "table") {
      const headerCells = Array.from(element.querySelectorAll("thead th"));
      const firstRowCells = Array.from(element.querySelectorAll("tr:first-child th, tr:first-child td"));
      const headers = (headerCells.length > 0 ? headerCells : firstRowCells).map(textOf);
      const rows = Array.from(element.querySelectorAll("tbody tr, tr"))
        .slice(headerCells.length > 0 ? 0 : 1)
        .map((row) => Array.from(row.querySelectorAll("td, th")).map(textOf))
        .filter((row) => row.length > 0);
      if (headers.length > 0) blocks.push(createTable(headers, rows));
      return;
    }
    if (tag === "img") {
      blocks.push(createImage({
        src: element.getAttribute("src") || "",
        alt: element.getAttribute("alt") || "",
        title: element.getAttribute("title") || "",
      }));
      return;
    }

    Array.from(element.children).forEach(pushElement);
  }

  Array.from(doc.body.children).forEach(pushElement);
  if (blocks.length === 0) {
    const text = textOf(doc.body);
    if (text) blocks.push(createParagraph(text));
  }

  return createDocumentModel({ title, sourceFormat: format, blocks });
}

export function readHtml({ content, title = "document", format = "html" }) {
  if (typeof DOMParser === "undefined") {
    return createDocumentModel({
      title,
      sourceFormat: format,
      blocks: [createParagraph(stripHtml(content))],
    });
  }
  return readHtmlWithDomParser(content, title, format);
}

export function renderHtmlDocument({ bodyHtml, title = "document" }) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; padding: 32px; font-family: system-ui, "Segoe UI", sans-serif; line-height: 1.65; color: #17202a; }
      main { max-width: 880px; margin: 0 auto; }
      pre { padding: 14px; background: #f4f6f8; overflow: auto; border-radius: 8px; }
      code { font-family: "Cascadia Code", Consolas, monospace; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; }
      blockquote { margin-left: 0; padding-left: 1em; border-left: 4px solid #94a3b8; color: #475569; }
      img { max-width: 100%; }
      @media print { body { padding: 0; } main { max-width: none; } }
    </style>
  </head>
  <body>
    <main>${bodyHtml}</main>
  </body>
</html>`;
}

export function writeHtml({ model, title = model.title }) {
  const assetMap = new Map((model.assets || []).map((asset) => [asset.id, asset]));
  const bodyHtml = modelToBodyHtml(model).replace(
    /<figure data-asset-id="([^"]+)"><figcaption>([\s\S]*?)<\/figcaption><\/figure>/g,
    (_, assetId, caption) => {
      const asset = assetMap.get(assetId);
      if (!asset || !asset.mime.startsWith("image/")) {
        return `<figure><figcaption>${caption}</figcaption></figure>`;
      }
      return `<figure><img src="${asset.data}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
    }
  );

  return {
    type: "text",
    format: "html",
    data: renderHtmlDocument({ bodyHtml, title }),
    mime: "text/html;charset=utf-8",
  };
}

export function writePdfPrintHtml({ model, title = model.title }) {
  const html = writeHtml({ model, title });
  return {
    type: "print",
    format: "pdf",
    data: html.data,
    mime: "text/html;charset=utf-8",
  };
}
