import { assertValidDocumentModel } from "../core/document-schema.js";
import { createCodeBlock, createDocumentModel, createHeading } from "../core/document-model.js";
import { getPlainText } from "../core/document-model.js";
import { writeMarkdown } from "./markdown.js";

export function readJson({ content, title = "document", format = "json" }) {
  let parsed;
  try {
    parsed = JSON.parse(String(content ?? ""));
  } catch (error) {
    throw new Error(`JSON 解析失败: ${error.message}`);
  }

  return createDocumentModel({
    title,
    sourceFormat: format,
    blocks: [
      createHeading(1, "JSON Document"),
      createCodeBlock(JSON.stringify(parsed, null, 2), "json"),
    ],
    metadata: {
      originalJson: parsed,
    },
  });
}

export function writeJson({ model, title = model.title }) {
  assertValidDocumentModel(model);
  const markdown = writeMarkdown({ model }).data.trim();
  return {
    type: "text",
    format: "json",
    data: `${JSON.stringify({
      schemaVersion: model.schemaVersion,
      title,
      from: model.sourceFormat,
      blocks: model.blocks,
      assets: model.assets,
      plainText: getPlainText(model),
      markdown,
    }, null, 2)}\n`,
    mime: "application/json;charset=utf-8",
  };
}
