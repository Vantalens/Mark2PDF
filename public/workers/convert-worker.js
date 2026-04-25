import { convertContent } from "../browser-transformer.js";

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
    self.postMessage({
      id,
      type: "error",
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "",
      },
    });
  }
});