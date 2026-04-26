import {
  convertContent as convertInBrowser,
  detectFormatFromName,
  getFormatCapabilities,
  getOutputExtension,
  renderPreviewHtml,
} from "./browser-transformer.js";
import { normalizeConversionError } from "./core/conversion-error.js";

const inputContent = document.getElementById("inputContent");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const fileMeta = document.getElementById("fileMeta");
const statusText = document.getElementById("statusText");
const htmlPreview = document.getElementById("htmlPreview");
const pdfPreview = document.getElementById("pdfPreview");
const textOutputPreview = document.getElementById("textOutputPreview");
const openPdfPreviewButton = document.getElementById("openPdfPreviewButton");
const errorDetailsPanel = document.getElementById("errorDetailsPanel");
const errorDetailsSummary = document.getElementById("errorDetailsSummary");
const errorCategory = document.getElementById("errorCategory");
const errorCode = document.getElementById("errorCode");
const errorFormat = document.getElementById("errorFormat");
const errorMessageText = document.getElementById("errorMessageText");
const errorDebugText = document.getElementById("errorDebugText");
const copyErrorDiagnosticsButton = document.getElementById("copyErrorDiagnosticsButton");
const outputMeta = document.getElementById("outputMeta");
const autoPreviewCheckbox = document.getElementById("autoPreviewCheckbox");
const refreshPreviewButton = document.getElementById("refreshPreviewButton");
const transformButton = document.getElementById("transformButton");
const cancelTransformButton = document.getElementById("cancelTransformButton");
const downloadOutputButton = document.getElementById("downloadOutputButton");
const loadSampleButton = document.getElementById("loadSampleButton");
const wordCountEl = document.getElementById("wordCount");
const lineCountEl = document.getElementById("lineCount");
const fromFormatSelect = document.getElementById("fromFormatSelect");
const toFormatSelect = document.getElementById("toFormatSelect");
const paperFormatSelect = document.getElementById("paperFormatSelect");

const formatCapabilities = getFormatCapabilities();

const sampleMarkdown = `# Trans2Former Demo

这是一个浏览器端转换示例。当前页面可在浏览器内完成 Markdown / HTML / TXT / JSON / CSV / XML 互转。

- 不依赖 Electron
- 不把文档内容发送到后端 API
- PDF 过渡方案使用浏览器打印并另存为 PDF

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}\`;
}
\`\`\`
`;

let currentFileName = "document.md";
let currentOutputBlobUrl = "";
let currentPrintHtml = "";
let previewTimer = null;
let lastRenderedPayload = "";
let autoPreviewEnabled = false;
let lastOutputIsPdf = false;
let convertWorker = null;
let convertJobSeq = 0;
let activeConversion = null;
let lastErrorDiagnostics = null;

const PREVIEW_DEBOUNCE_MS = 300;
const LARGE_DOC_THRESHOLD = 12000;

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.dataset.type = type;
  if (type === "error") {
    statusText.style.color = "#b23a48";
  } else if (type === "success") {
    statusText.style.color = "#0f6d5f";
  } else {
    statusText.style.color = "#5d6875";
  }
}

function setFileMeta(message) {
  fileMeta.textContent = message;
}

function setOutputMeta(message) {
  outputMeta.textContent = message;
}

function sanitizeErrorDiagnostics(errorLike) {
  const normalized = normalizeConversionError(errorLike);
  return {
    category: normalized.category,
    code: normalized.code,
    format: normalized.format,
    message: normalized.message,
    warnings: Array.isArray(normalized.details?.warnings) ? normalized.details.warnings : [],
  };
}

function clearErrorDetails() {
  lastErrorDiagnostics = null;
  errorDetailsPanel.hidden = true;
  errorDetailsSummary.textContent = "等待转换";
  errorCategory.textContent = "-";
  errorCode.textContent = "-";
  errorFormat.textContent = "-";
  errorMessageText.textContent = "";
  errorDebugText.textContent = "";
}

function renderErrorDetails(errorLike) {
  const normalized = normalizeConversionError(errorLike);
  const diagnostics = sanitizeErrorDiagnostics(normalized);
  lastErrorDiagnostics = diagnostics;

  errorDetailsPanel.hidden = false;
  errorDetailsSummary.textContent = diagnostics.message || "转换失败";
  errorCategory.textContent = diagnostics.category || "-";
  errorCode.textContent = diagnostics.code || "-";
  errorFormat.textContent = diagnostics.format || "-";
  errorMessageText.textContent = diagnostics.message || "转换失败";
  errorDebugText.textContent = JSON.stringify({
    ...diagnostics,
    details: normalized.details || {},
  }, null, 2);
}

async function copyErrorDiagnostics() {
  if (!lastErrorDiagnostics) {
    setStatus("没有可复制的诊断信息", "info");
    return;
  }
  const text = JSON.stringify(lastErrorDiagnostics, null, 2);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    setStatus("已复制脱敏诊断信息", "success");
    return;
  }
  errorDebugText.textContent = text;
  setStatus("浏览器不支持剪贴板写入，已在高级调试信息中显示脱敏诊断", "info");
}

function updateWordCount() {
  const text = inputContent.value;
  wordCountEl.textContent = `字数: ${text.length}`;
  lineCountEl.textContent = `行数: ${text.split("\n").length}`;
}

function revokeOutputUrl() {
  if (currentOutputBlobUrl) {
    URL.revokeObjectURL(currentOutputBlobUrl);
    currentOutputBlobUrl = "";
  }
}

function setTransformBusy(isBusy) {
  transformButton.disabled = isBusy;
  cancelTransformButton.disabled = !isBusy;
  cancelTransformButton.hidden = !isBusy;
}

function updateDownloadState(enabled) {
  if (enabled) {
    downloadOutputButton.classList.remove("disabled");
    openPdfPreviewButton.disabled = !lastOutputIsPdf;
  } else {
    downloadOutputButton.classList.add("disabled");
    downloadOutputButton.href = "#";
    openPdfPreviewButton.disabled = true;
  }
}

function updateOutputPreviewVisibility(isPdf) {
  lastOutputIsPdf = isPdf;
  if (isPdf) {
    pdfPreview.style.display = "block";
    openPdfPreviewButton.style.display = "block";
    openPdfPreviewButton.textContent = "浏览器打印 / 另存为 PDF";
    textOutputPreview.style.display = "none";
  } else {
    pdfPreview.style.display = "none";
    openPdfPreviewButton.style.display = "none";
    textOutputPreview.style.display = "block";
  }
}

function getPayloadKey() {
  return JSON.stringify({
    content: inputContent.value,
    from: fromFormatSelect.value,
    file: currentFileName,
  });
}

function syncPdfPaperControl() {
  paperFormatSelect.disabled = toFormatSelect.value !== "pdf";
}

function updateFormatCapabilityNote() {
  const noteEl = document.getElementById("formatCapabilityNote");
  if (!noteEl) {
    return;
  }
  const from = formatCapabilities.find((item) => item.format === fromFormatSelect.value);
  const to = formatCapabilities.find((item) => item.format === toFormatSelect.value);
  const notes = [];
  if (from?.note) notes.push(`输入 ${from.label}: ${from.note}`);
  if (to?.note) notes.push(`输出 ${to.label}: ${to.note}`);
  noteEl.textContent = notes.length > 0 ? notes.join("；") : "当前转换会经过 DocumentModel 标准化，复杂样式可能降级。";
}

function syncFormatOptions() {
  const currentFrom = fromFormatSelect.value || "md";
  const currentTo = toFormatSelect.value || "html";
  fromFormatSelect.replaceChildren(...formatCapabilities
    .filter((item) => item.canRead)
    .map((item) => new Option(item.label, item.format)));
  toFormatSelect.replaceChildren(...formatCapabilities
    .filter((item) => item.canWrite)
    .map((item) => new Option(item.label, item.format)));
  fromFormatSelect.value = [...fromFormatSelect.options].some((option) => option.value === currentFrom) ? currentFrom : "md";
  toFormatSelect.value = [...toFormatSelect.options].some((option) => option.value === currentTo) ? currentTo : "html";
  updateFormatCapabilityNote();
}

function getBaseName(fileName) {
  return String(fileName || "document").replace(/\.[^.]+$/g, "") || "document";
}

function renderPreview() {
  const renderStart = Date.now();
  const payloadKey = getPayloadKey();
  if (payloadKey === lastRenderedPayload) {
    return;
  }

  setStatus("正在浏览器端渲染预览...");
  const bodyHtml = renderPreviewHtml(inputContent.value, fromFormatSelect.value);
  htmlPreview.innerHTML = bodyHtml;
  lastRenderedPayload = payloadKey;
  setStatus(`浏览器端预览已更新 (${Date.now() - renderStart}ms)`, "success");
}

function schedulePreviewUpdate() {
  if (!autoPreviewEnabled) {
    setStatus("内容已更新，点击“刷新预览”查看", "info");
    return;
  }
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    try {
      renderPreview();
    } catch (error) {
      setStatus(error.message, "error");
    }
  }, PREVIEW_DEBOUNCE_MS);
}

async function handleInputText(rawContent, fileName = currentFileName) {
  currentFileName = fileName;
  inputContent.value = rawContent;
  setFileMeta(fileName);
  updateDownloadState(false);
  setOutputMeta("尚未生成");
  revokeOutputUrl();
  currentPrintHtml = "";
  pdfPreview.removeAttribute("src");
  textOutputPreview.textContent = "";
  lastRenderedPayload = "";
  clearErrorDetails();
  updateWordCount();
  renderPreview();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")), { once: true });
    reader.addEventListener("error", () => reject(reader.error || new Error("文件读取失败")), { once: true });
    reader.readAsDataURL(file);
  });
}

async function handleFile(file) {
  if (!file) {
    return;
  }

  const detectedFormat = detectFormatFromName(file.name);
  if (!detectedFormat) {
    setStatus("请选择 .md / .html / .txt / .json / .csv / .xml / .png 文件", "error");
    return;
  }

  try {
    const content = detectedFormat === "png" ? await readFileAsDataUrl(file) : await file.text();
    fromFormatSelect.value = detectedFormat;
    await handleInputText(content, file.name);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function createDownloadUrl(outputText, mime) {
  revokeOutputUrl();
  currentOutputBlobUrl = URL.createObjectURL(new Blob([outputText], { type: mime }));
  return currentOutputBlobUrl;
}

function createConvertWorker() {
  if (typeof Worker === "undefined") {
    return null;
  }
  return new Worker("/workers/convert-worker.js", { type: "module" });
}

function convertWithWorker(payload) {
  const worker = createConvertWorker();
  if (!worker) {
    return Promise.resolve(convertInBrowser(payload));
  }

  const id = `convert-${Date.now()}-${++convertJobSeq}`;
  return new Promise((resolve, reject) => {
    function cleanup() {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      if (activeConversion?.id === id) {
        activeConversion = null;
      }
      worker.terminate();
    }

    function handleError(event) {
      cleanup();
      reject(new Error(event.message || "Worker 转换失败"));
    }

    function handleMessage(event) {
      const message = event.data || {};
      if (message.id !== id) {
        return;
      }
      if (message.type === "progress") {
        setStatus(message.message || `转换进度 ${Math.round((message.progress || 0) * 100)}%`);
        return;
      }
      cleanup();
      if (message.type === "result") {
        resolve(message.result);
        return;
      }
      const workerError = new Error(message.error?.message || "转换失败");
      Object.assign(workerError, message.error || {});
      reject(workerError);
    }

    activeConversion = { id, worker, reject };
    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({ id, payload });
  });
}

async function transformContent() {
  const content = inputContent.value;
  if (!content.trim()) {
    setStatus("请先上传或输入内容", "error");
    return;
  }

  const from = fromFormatSelect.value;
  const to = toFormatSelect.value;

  setTransformBusy(true);
  setStatus("正在浏览器端执行转换...");
  clearErrorDetails();

  try {
    const title = getBaseName(currentFileName);
    const result = await convertWithWorker({ content, from, to, title, fileName: currentFileName });
    const baseName = getBaseName(currentFileName);

    if (result.type === "print") {
      currentPrintHtml = result.data;
      const previewUrl = createDownloadUrl(currentPrintHtml, result.mime);
      pdfPreview.src = previewUrl;

      downloadOutputButton.href = previewUrl;
      downloadOutputButton.download = `${baseName}.print.html`;
      downloadOutputButton.textContent = "下载打印版 HTML";

      updateOutputPreviewVisibility(true);
      updateDownloadState(true);
      setOutputMeta("已生成浏览器打印页面");
      setStatus("已生成打印页面，可用浏览器另存为 PDF", "success");
      return;
    }

    textOutputPreview.textContent = result.data;
    const outputUrl = createDownloadUrl(result.data, result.mime);
    downloadOutputButton.href = outputUrl;
    downloadOutputButton.download = `${baseName}.${getOutputExtension(result.format)}`;
    downloadOutputButton.textContent = "下载输出";

    updateOutputPreviewVisibility(false);
    updateDownloadState(true);
    setOutputMeta(`文本输出已生成 · ${result.data.length} chars`);
    setStatus("浏览器端转换成功", "success");
  } catch (error) {
    if (error.message === "转换已取消") {
      setStatus("转换已取消", "info");
    } else {
      renderErrorDetails(error);
      setStatus(error.message, "error");
    }
  } finally {
    setTransformBusy(false);
  }
}

function printCurrentPdf() {
  if (!currentPrintHtml) {
    setStatus("当前没有可打印内容", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setStatus("浏览器阻止了打印窗口，请允许弹窗后重试", "error");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(currentPrintHtml);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  }, { once: true });
}

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  handleFile(file);
});

inputContent.addEventListener("input", () => {
  schedulePreviewUpdate();
  updateWordCount();
  if (autoPreviewEnabled && inputContent.value.length > LARGE_DOC_THRESHOLD) {
    autoPreviewEnabled = false;
    autoPreviewCheckbox.checked = false;
    setStatus("文档较大，已自动切换为手动预览模式", "info");
  }
});

inputContent.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    transformContent();
  }
});

refreshPreviewButton.addEventListener("click", () => {
  try {
    renderPreview();
  } catch (error) {
    setStatus(error.message, "error");
  }
});

autoPreviewCheckbox.addEventListener("change", () => {
  autoPreviewEnabled = autoPreviewCheckbox.checked;
  if (autoPreviewEnabled) {
    setStatus("已开启自动预览", "success");
    schedulePreviewUpdate();
  } else {
    window.clearTimeout(previewTimer);
    setStatus("已切换为手动预览模式", "info");
  }
});

fromFormatSelect.addEventListener("change", () => {
  lastRenderedPayload = "";
  schedulePreviewUpdate();
  updateFormatCapabilityNote();
});

toFormatSelect.addEventListener("change", () => {
  syncPdfPaperControl();
  updateOutputPreviewVisibility(toFormatSelect.value === "pdf");
  updateFormatCapabilityNote();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-active");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-active");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-active");
  const [file] = event.dataTransfer.files || [];
  handleFile(file);
});

transformButton.addEventListener("click", transformContent);
copyErrorDiagnosticsButton.addEventListener("click", () => {
  copyErrorDiagnostics().catch((error) => setStatus(error.message, "error"));
});
cancelTransformButton.addEventListener("click", () => {
  if (!activeConversion) {
    return;
  }
  const { worker, reject } = activeConversion;
  activeConversion = null;
  worker.terminate();
  reject(new Error("转换已取消"));
  setTransformBusy(false);
  setStatus("转换已取消", "info");
});
openPdfPreviewButton.addEventListener("click", printCurrentPdf);

downloadOutputButton.addEventListener("click", (event) => {
  if (downloadOutputButton.classList.contains("disabled")) {
    event.preventDefault();
  }
});

loadSampleButton.addEventListener("click", () => {
  fromFormatSelect.value = "md";
  toFormatSelect.value = "html";
  syncPdfPaperControl();
  handleInputText(sampleMarkdown, "sample.md");
});

function bootstrapInitialSample() {
  currentFileName = "sample.md";
  inputContent.value = sampleMarkdown;
  setFileMeta("sample.md");
  setOutputMeta("尚未生成");
  updateOutputPreviewVisibility(false);
  updateDownloadState(false);
  revokeOutputUrl();
  pdfPreview.removeAttribute("src");
  textOutputPreview.textContent = "";
  lastRenderedPayload = "";
  updateWordCount();
  renderPreview();
  setStatus("示例已加载，当前转换在浏览器端执行", "success");
}

syncFormatOptions();
bootstrapInitialSample();
autoPreviewCheckbox.checked = false;
syncPdfPaperControl();
openPdfPreviewButton.disabled = true;
