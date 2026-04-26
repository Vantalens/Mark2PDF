import { convertContent } from "../browser-transformer.js";
import { normalizeConversionError } from "../core/conversion-error.js";

self.addEventListener("message", (event) => {
  const { id, payload } = event.data || {};
  if (!id || !payload) {
    return;
  }

  try {
    self.postMessage({ id, type: "progress", progress: 0.2, message: "正在读取输入" });
    const result = convertContent(payload);
    self.postMessage({ id, type: "progress", progress: 1, message: "转换完成" });
    self.postMessage({ id, type: "result", result });
  } catch (error) {
    const conversionError = normalizeConversionError(error);
    self.postMessage({
      id,
      type: "error",
      error: {
        ...conversionError.toJSON(),
        stack: error instanceof Error ? error.stack : "",
      },
    });
  }
});
