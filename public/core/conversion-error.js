const VALID_CATEGORIES = new Set(["parse", "validate", "convert", "render", "download"]);

function normalizeCategory(category) {
  return VALID_CATEGORIES.has(category) ? category : "convert";
}

export class ConversionError extends Error {
  constructor(message, {
    category = "convert",
    code = "CONVERSION_ERROR",
    format = "",
    details = {},
    cause,
  } = {}) {
    super(String(message || "转换失败"), { cause });
    this.name = "ConversionError";
    this.category = normalizeCategory(category);
    this.code = String(code || "CONVERSION_ERROR");
    this.format = String(format || "");
    this.details = details && typeof details === "object" ? details : {};
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      code: this.code,
      format: this.format,
      details: this.details,
    };
  }
}

export function normalizeConversionError(error, fallback = {}) {
  if (error instanceof ConversionError) {
    return error;
  }
  const message = error instanceof Error ? error.message : String(error || "转换失败");
  return new ConversionError(message, {
    category: error?.category || fallback.category,
    code: error?.code || fallback.code,
    format: error?.format || fallback.format,
    details: error?.details || fallback.details,
    cause: error instanceof Error ? error : undefined,
  });
}
