import { convertContent } from "../browser-transformer.js";
import { normalizeConversionError } from "../core/conversion-error.js";
import { decodeTextBytes } from "../core/text-decoding.js";

const STAGES = [
  { stage: "read", progress: 0.1, message: "正在读取输入" },
  { stage: "parse", progress: 0.28, message: "正在解析内容" },
  { stage: "validate", progress: 0.46, message: "正在校验结构" },
  { stage: "convert", progress: 0.64, message: "正在转换格式" },
  { stage: "render", progress: 0.82, message: "正在渲染输出" },
  { stage: "package", progress: 0.94, message: "正在准备下载" },
];

function postProgress(id, stageInfo) {
  workerScope?.postMessage({ id, type: "progress", ...stageInfo });
}

export function normalizeWorkerPayload(payload) {
  if (!payload?.contentBuffer) {
    return payload;
  }
  return {
    ...payload,
    content: decodeTextBytes(new Uint8Array(payload.contentBuffer), {
      fileName: payload.fileName || "",
      encoding: payload.contentEncoding || "utf-8",
      trustEncoding: true,
    }).text,
    contentBuffer: undefined,
  };
}

const workerScope = typeof self !== "undefined" ? self : null;

workerScope?.addEventListener("message", (event) => {
  const { id, payload } = event.data || {};
  if (!id || !payload) {
    return;
  }

  try {
    postProgress(id, STAGES[0]);
    postProgress(id, STAGES[1]);
    postProgress(id, STAGES[2]);
    postProgress(id, STAGES[3]);
    const result = convertContent(normalizeWorkerPayload(payload));
    postProgress(id, STAGES[4]);
    postProgress(id, STAGES[5]);
    workerScope.postMessage({ id, type: "progress", stage: "complete", progress: 1, message: "转换完成" });
    workerScope.postMessage({ id, type: "result", result });
  } catch (error) {
    const conversionError = normalizeConversionError(error);
    workerScope.postMessage({
      id,
      type: "error",
      error: {
        ...conversionError.toJSON(),
        stack: error instanceof Error ? error.stack : "",
      },
    });
  }
});
