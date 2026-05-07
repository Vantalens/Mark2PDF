import { ConversionError } from "./conversion-error.js";
import { ensureDocumentAudit } from "./document-audit.js";

const FORMAT_ALIASES = {
  markdown: "md",
  mdown: "md",
  mkd: "md",
  htm: "html",
  text: "txt",
  plain: "txt",
  plaintext: "txt",
};

const ALLOWED_OUTPUTS_BY_INPUT = {
  md: ["md", "html", "txt", "json", "csv", "xml", "docx", "xlsx", "pdf", "epub", "pptx"],
  html: ["md", "html", "txt", "json", "csv", "xml", "docx", "xlsx", "pdf", "epub", "pptx"],
  txt: ["md", "html", "txt", "json", "docx", "pdf", "epub"],
  json: ["md", "html", "txt", "json", "csv", "xml", "docx", "xlsx", "pdf", "epub", "pptx"],
  xml: ["md", "html", "txt", "json", "pdf"],
  csv: ["md", "csv", "xlsx", "html", "txt", "json", "pdf"],
  xlsx: ["md", "csv", "xlsx", "html", "txt", "json", "pdf"],
  doc: ["md", "html", "txt", "json", "docx", "pdf"],
  docx: ["md", "html", "txt", "json", "docx", "pdf"],
  epub: ["md", "html", "txt", "json", "docx", "pdf", "epub"],
  pdf: ["md", "html", "txt", "json", "docx", "pdf"],
  pptx: ["md", "html", "txt", "json", "pdf"],
  png: ["html", "txt", "json", "pdf"],
  ofd: ["md", "html", "txt", "json", "pdf"],
};

export function normalizeFormat(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return FORMAT_ALIASES[normalized] || normalized;
}

export function getAllowedOutputFormats(from) {
  return [...(ALLOWED_OUTPUTS_BY_INPUT[normalizeFormat(from)] || [])];
}

export class ConverterRegistry {
  constructor() {
    this.readers = new Map();
    this.writers = new Map();
    this.extensions = new Map();
    this.mimes = new Map();
    this.labels = new Map();
    this.notes = new Map();
  }

  registerFormat(format, {
    read,
    write,
    extension = format,
    mime = "text/plain;charset=utf-8",
    label = format,
    note = "",
    qualityGrade = "basic",
    warnings = [],
    resourceBudget = {},
    degradation = "",
  }) {
    const normalized = normalizeFormat(format);
    if (typeof read === "function") {
      this.readers.set(normalized, read);
    }
    if (typeof write === "function") {
      this.writers.set(normalized, write);
    }
    this.extensions.set(normalized, extension);
    this.mimes.set(normalized, mime);
    this.labels.set(normalized, label);
    this.notes.set(normalized, note);
    this.capabilityDetails ??= new Map();
    this.capabilityDetails.set(normalized, {
      qualityGrade,
      warnings: warnings.map((warning) => String(warning)),
      resourceBudget: {
        maxInputBytes: Number(resourceBudget.maxInputBytes) || 10 * 1024 * 1024,
        maxRuntimeMemoryMb: Number(resourceBudget.maxRuntimeMemoryMb) || 256,
      },
      degradation: String(degradation || note || "No degradation note yet."),
    });
  }

  listFormats() {
    return {
      input: [...this.readers.keys()],
      output: [...this.writers.keys()],
    };
  }

  canRead(format) {
    return this.readers.has(normalizeFormat(format));
  }

  canWrite(format) {
    return this.writers.has(normalizeFormat(format));
  }

  getOutputExtension(format) {
    return this.extensions.get(normalizeFormat(format)) || "out";
  }

  getCapabilities() {
    const formats = new Set([...this.readers.keys(), ...this.writers.keys()]);
    return [...formats].map((format) => ({
      format,
      label: this.labels.get(format) || format,
      canRead: this.canRead(format),
      canWrite: this.canWrite(format),
      extension: this.getOutputExtension(format),
      mime: this.mimes.get(format) || "application/octet-stream",
      note: this.notes.get(format) || "",
      ...(this.capabilityDetails?.get(format) || {}),
    }));
  }

  read({ content, from, title = "document", fileName = "" }) {
    const fromFormat = normalizeFormat(from);
    const reader = this.readers.get(fromFormat);
    if (!reader) {
      throw new ConversionError(`输入格式不支持: ${fromFormat || "(empty)"}`, {
        category: "convert",
        code: "UNSUPPORTED_INPUT_FORMAT",
        format: fromFormat,
      });
    }
    const model = reader({ content, title, fileName, format: fromFormat });
    return ensureDocumentAudit(model, {
      content,
      reader: fromFormat,
      fileName,
    });
  }

  write({ model, to, title = model?.title || "document", options = {} }) {
    const toFormat = normalizeFormat(to);
    const writer = this.writers.get(toFormat);
    if (!writer) {
      throw new ConversionError(`输出格式不支持: ${toFormat || "(empty)"}`, {
        category: "convert",
        code: "UNSUPPORTED_OUTPUT_FORMAT",
        format: toFormat,
      });
    }
    const auditedModel = ensureDocumentAudit(model, {
      writer: toFormat,
      targetFormat: toFormat,
    });
    return writer({ model: auditedModel, title, format: toFormat, options });
  }

  convert({ content, from, to, title = "document", fileName = "", options = {} }) {
    const fromFormat = normalizeFormat(from);
    const toFormat = normalizeFormat(to);
    if (!this.writers.has(toFormat)) {
      throw new ConversionError(`输出格式不支持: ${toFormat || "(empty)"}`, {
        category: "convert",
        code: "UNSUPPORTED_OUTPUT_FORMAT",
        format: toFormat,
      });
    }
    if (!getAllowedOutputFormats(fromFormat).includes(toFormat)) {
      throw new ConversionError(`不支持此转换路径: ${fromFormat || "(empty)"} -> ${toFormat || "(empty)"}`, {
        category: "convert",
        code: "UNSUPPORTED_CONVERSION_PATH",
        format: `${fromFormat}->${toFormat}`,
      });
    }
    const model = this.read({ content, from, title, fileName });
    return this.write({ model, to, title, options });
  }
}
