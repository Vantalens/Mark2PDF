// SemanticDoc 数据结构 + inline 节点工厂。
//
// SemanticDoc 是 P8 多模型架构里"语义文档"模型，承载流式标题/段落/列表/表格/
// 代码/引用/资产引用 + 行内格式（粗体/斜体/链接/行内代码/删除/上下标）。
//
// 现阶段仍然复用 document-model.js 的 block 工厂（createDocumentModel /
// createParagraph / createHeading 等），保持向后兼容；本文件追加 inline 工厂
// （createInlineText / createInlineStrong / createInlineEm / createInlineLink /
// createInlineCode / createInlineDel）和 inline 渲染工具（inlinesToPlainText /
// inlinesToMarkdown / inlinesToHtml）。
//
// 调用方在 reader 阶段产出 inline 节点数组，写入 block.inlines；writer 阶段优先
// 消费 block.inlines，缺省时回落到 block.text。这样 HTML / Markdown / DOCX
// reader 都能保留行内格式，不再把 `**bold**` 字面量塞进 paragraph.text。
//
// 详见 docs/MULTI_MODEL_ARCHITECTURE.md。

export {
  createDocumentModel,
  createParagraph,
  createHeading,
  createList,
  createCodeBlock,
  createTable,
  createQuote,
  createImage,
  createAssetReference,
  createRawBlock,
  getPlainText,
} from "../document-model.js";

export {
  createInlineText,
  createInlineStrong,
  createInlineEm,
  createInlineLink,
  createInlineCode,
  createInlineDel,
  createInlineLineBreak,
  normalizeInlines,
  inlinesToPlainText,
  inlinesToMarkdown,
  inlinesToHtml,
} from "./semantic-inlines.js";
