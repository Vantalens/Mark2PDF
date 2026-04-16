const markdownInput = document.getElementById("markdownInput");
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const fileMeta = document.getElementById("fileMeta");
const statusText = document.getElementById("statusText");
const htmlPreview = document.getElementById("htmlPreview");
const pdfPreview = document.getElementById("pdfPreview");
const openPdfPreviewButton = document.getElementById("openPdfPreviewButton");
const pdfMeta = document.getElementById("pdfMeta");
const previewMeta = document.getElementById("previewMeta");
const autoPreviewCheckbox = document.getElementById("autoPreviewCheckbox");
const refreshPreviewButton = document.getElementById("refreshPreviewButton");
const generatePdfButton = document.getElementById("generatePdfButton");
const downloadPdfButton = document.getElementById("downloadPdfButton");
const loadSampleButton = document.getElementById("loadSampleButton");

const sampleMarkdown = `# Mark2PDF Web 演示

这是中文、English 与特殊符号：∞ ≠ ≤ ≥ ± © ® ™ Ω → ← ✓ ✗。

行内公式：$e^{i\\pi}+1=0$。

块级公式：

$$
\\int_{0}^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

- [x] 预览 Markdown
- [x] 生成 PDF
- [ ] 下载 PDF


default code example


def sum(a, b) {
  return a + b;
}
`;

let currentFileName = "document.md";
let currentSourcePath = "";
let currentPdfUrl = "";
let previewTimer = null;
let previewToken = 0;
let previewController = null;
let lastRenderedMarkdown = "";
let autoPreviewEnabled = false;

const PREVIEW_DEBOUNCE_MS = 700;
const LARGE_DOC_THRESHOLD = 12000;

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.dataset.type = type;
}

function setFileMeta(message) {
  fileMeta.textContent = message;
}

function setPdfMeta(message) {
  pdfMeta.textContent = message;
}

function revokePdfUrl() {
  if (currentPdfUrl) {
    URL.revokeObjectURL(currentPdfUrl);
    currentPdfUrl = "";
  }
}

function updatePdfDownloadState(enabled) {
  if (enabled) {
    downloadPdfButton.classList.remove("disabled");
    openPdfPreviewButton.disabled = false;
  } else {
    downloadPdfButton.classList.add("disabled");
    downloadPdfButton.href = "#";
    openPdfPreviewButton.disabled = true;
  }
}

function updatePreviewMeta() {
  previewMeta.textContent = autoPreviewEnabled ? "自动刷新" : "手动刷新";
}

async function renderPreview(markdown) {
  const normalizedMarkdown = String(markdown ?? "");
  if (normalizedMarkdown === lastRenderedMarkdown) {
    return;
  }

  if (previewController) {
    previewController.abort();
  }
  previewController = new AbortController();

  const token = ++previewToken;
  setStatus("正在渲染预览...");

  const response = await fetch("/api/render-html", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      markdown: normalizedMarkdown,
      filename: currentFileName,
      sourcePath: currentSourcePath,
    }),
    signal: previewController.signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "预览渲染失败");
  }

  const data = await response.json();
  if (token !== previewToken) {
    return;
  }

  htmlPreview.innerHTML = data.bodyHtml;

  lastRenderedMarkdown = normalizedMarkdown;
  setStatus("预览已更新");
}

function schedulePreviewUpdate() {
  if (!autoPreviewEnabled) {
    setStatus("内容已更新，点击“刷新预览”查看", "info");
    return;
  }

  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    renderPreview(markdownInput.value).catch((error) => {
      if (error.name !== "AbortError") {
        setStatus(error.message, "error");
      }
    });
  }, PREVIEW_DEBOUNCE_MS);
}

async function handleMarkdownText(markdown, fileName = currentFileName) {
  currentFileName = fileName;
  markdownInput.value = markdown;
  setFileMeta(fileName);
  setStatus("文件已载入，正在预览...");
  updatePdfDownloadState(false);
  setPdfMeta("尚未生成");
  openPdfPreviewButton.textContent = "加载 PDF 预览";
  revokePdfUrl();
  pdfPreview.removeAttribute("src");
  lastRenderedMarkdown = "";
  await renderPreview(markdown);
}

async function readFile(file) {
  return await file.text();
}

async function handleFile(file) {
  if (!file) return;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["md", "markdown"].includes(ext)) {
    setStatus("请选择 .md 或 .markdown 文件", "error");
    return;
  }

  try {
    const markdown = await readFile(file);
    currentSourcePath = typeof file.path === "string" ? file.path : "";
    await handleMarkdownText(markdown, file.name);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function generatePdf() {
  const markdown = markdownInput.value;
  if (!markdown.trim()) {
    setStatus("请先上传或输入 Markdown 内容", "error");
    return;
  }

  generatePdfButton.disabled = true;
  setStatus("正在生成 PDF...");

  try {
    const response = await fetch("/api/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markdown,
        filename: currentFileName,
        sourcePath: currentSourcePath,
        format: "A4",
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "PDF 生成失败，请检查文档内容或图片路径");
    }

    const pdfBlob = await response.blob();
    revokePdfUrl();
    currentPdfUrl = URL.createObjectURL(pdfBlob);
    downloadPdfButton.href = currentPdfUrl;
    downloadPdfButton.download = currentFileName.replace(/\.(md|markdown)$/i, "") + ".pdf";
    openPdfPreviewButton.textContent = "加载 PDF 预览";
    updatePdfDownloadState(true);
    setPdfMeta(`已生成 PDF · ${(pdfBlob.size / 1024).toFixed(1)} KB · 未加载预览`);
    setStatus("PDF 已生成，可预览或下载", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    generatePdfButton.disabled = false;
  }
}

fileInput.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  handleFile(file);
});

markdownInput.addEventListener("input", schedulePreviewUpdate);

refreshPreviewButton.addEventListener("click", () => {
  renderPreview(markdownInput.value).catch((error) => {
    if (error.name !== "AbortError") {
      setStatus(error.message, "error");
    }
  });
});

autoPreviewCheckbox.addEventListener("change", () => {
  autoPreviewEnabled = autoPreviewCheckbox.checked;
  updatePreviewMeta();

  if (autoPreviewEnabled) {
    setStatus("已开启自动预览", "success");
    schedulePreviewUpdate();
  } else {
    window.clearTimeout(previewTimer);
    setStatus("已切换为手动预览模式", "info");
  }
});

markdownInput.addEventListener("input", () => {
  if (autoPreviewEnabled && markdownInput.value.length > LARGE_DOC_THRESHOLD) {
    autoPreviewEnabled = false;
    autoPreviewCheckbox.checked = false;
    updatePreviewMeta();
    setStatus("文档较大，已自动切换为手动预览模式", "info");
  }
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

generatePdfButton.addEventListener("click", generatePdf);

openPdfPreviewButton.addEventListener("click", () => {
  if (!currentPdfUrl) {
    setStatus("请先生成 PDF", "error");
    return;
  }

  pdfPreview.src = currentPdfUrl;
  pendingPdfPreviewLoad = false;
  openPdfPreviewButton.textContent = "重新加载 PDF 预览";
  setPdfMeta("PDF 预览已加载（按 Alt + 滚轮可在预览内滚动）");
});

downloadPdfButton.addEventListener("click", (event) => {
  if (downloadPdfButton.classList.contains("disabled")) {
    event.preventDefault();
  }
});

loadSampleButton.addEventListener("click", () => {
  currentSourcePath = "";
  handleMarkdownText(sampleMarkdown, "sample.md").catch((error) => {
    setStatus(error.message, "error");
  });
});

handleMarkdownText(sampleMarkdown, "sample.md").catch((error) => {
  setStatus(error.message, "error");
});

autoPreviewCheckbox.checked = false;
updatePreviewMeta();
openPdfPreviewButton.disabled = true;
