export function createDocumentModel({
  title = "document",
  sourceFormat = "",
  blocks = [],
  assets = [],
  metadata = {},
} = {}) {
  return {
    schemaVersion: "trans2former.document.v1",
    title,
    sourceFormat,
    blocks,
    assets,
    metadata,
  };
}

export function createParagraph(text) {
  return {
    type: "paragraph",
    text: String(text ?? ""),
  };
}

export function createHeading(level, text) {
  return {
    type: "heading",
    level: Math.min(6, Math.max(1, Number(level) || 1)),
    text: String(text ?? ""),
  };
}

export function createList(items, ordered = false) {
  return {
    type: "list",
    ordered: Boolean(ordered),
    items: items.map((item) => String(item ?? "")),
  };
}

export function createCodeBlock(code, language = "") {
  return {
    type: "code",
    language: String(language ?? ""),
    code: String(code ?? ""),
  };
}

export function createTable(headers = [], rows = []) {
  return {
    type: "table",
    headers: headers.map((header) => String(header ?? "")),
    rows: rows.map((row) => row.map((cell) => String(cell ?? ""))),
  };
}

export function createQuote(text) {
  return {
    type: "quote",
    text: String(text ?? ""),
  };
}

export function createImage({ src = "", alt = "", title = "" } = {}) {
  return {
    type: "image",
    src: String(src ?? ""),
    alt: String(alt ?? ""),
    title: String(title ?? ""),
  };
}

export function createAssetReference(assetId, { alt = "", title = "" } = {}) {
  return {
    type: "asset",
    assetId: String(assetId ?? ""),
    alt: String(alt ?? ""),
    title: String(title ?? ""),
  };
}

export function createRawBlock(format, content) {
  return {
    type: "raw",
    format: String(format ?? ""),
    content: String(content ?? ""),
  };
}

export function getPlainText(model) {
  return model.blocks
    .map((block) => {
      if (block.type === "heading" || block.type === "paragraph" || block.type === "quote") {
        return block.text;
      }
      if (block.type === "list") {
        return block.items.join("\n");
      }
      if (block.type === "code") {
        return block.code;
      }
      if (block.type === "table") {
        return [block.headers.join("\t"), ...block.rows.map((row) => row.join("\t"))].filter(Boolean).join("\n");
      }
      if (block.type === "image") {
        return block.alt || block.title || block.src;
      }
      if (block.type === "asset") {
        return block.alt || block.title || block.assetId;
      }
      if (block.type === "raw") {
        return block.content;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}