import {
  convertContent,
  detectFormatFromName,
  getOutputExtension,
  renderPreviewHtml,
} from "./browser-transformer.js";

const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const detailsEl = document.getElementById("details");

function record(message) {
  const item = document.createElement("li");
  item.textContent = message;
  resultsEl.append(item);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  record(message);
}

function createDownloadAnchor(result, fileName) {
  const baseName = fileName.replace(/\.[^.]+$/g, "") || "document";
  const anchor = document.createElement("a");
  anchor.download = `${baseName}.${getOutputExtension(result.format)}`;
  anchor.href = URL.createObjectURL(new Blob([result.data], { type: result.mime }));
  anchor.textContent = "download";
  document.body.append(anchor);
  return anchor;
}

async function runBrowserSmokeTest() {
  const sampleFile = new File(
    ["# Browser Smoke\n\n上传样例，并转换为 HTML。\n\n- preview\n- download"],
    "browser-smoke.md",
    { type: "text/markdown" }
  );
  const inputContent = await sampleFile.text();
  const from = detectFormatFromName(sampleFile.name);
  const to = "html";

  assert(from === "md", "上传样例文件后能识别 Markdown 输入格式");

  const previewHtml = renderPreviewHtml(inputContent, from, sampleFile.name);
  assert(previewHtml.includes("<h1>Browser Smoke</h1>"), "刷新预览能渲染标准化 HTML");

  const result = convertContent({
    content: inputContent,
    from,
    to,
    title: sampleFile.name,
    fileName: sampleFile.name,
  });
  assert(result.format === "html", "选择输出格式后能执行 HTML 转换");
  assert(result.data.includes("<main>"), "转换输出包含可下载 HTML 文档");

  const downloadAnchor = createDownloadAnchor(result, sampleFile.name);
  assert(downloadAnchor.download === "browser-smoke.html", "下载链接使用目标格式扩展名");
  assert(downloadAnchor.href.startsWith("blob:"), "下载链接使用浏览器 Blob URL");

  const pdfResult = convertContent({
    content: inputContent,
    from,
    to: "pdf",
    title: sampleFile.name,
    fileName: sampleFile.name,
  });
  assert(pdfResult.type === "print", "PDF 过渡输出走浏览器打印路径");
}

try {
  await runBrowserSmokeTest();
  statusEl.dataset.state = "pass";
  statusEl.textContent = "浏览器端 smoke test 通过";
  window.__TRANS2FORMER_BROWSER_SMOKE__ = { ok: true };
} catch (error) {
  statusEl.dataset.state = "fail";
  statusEl.textContent = "浏览器端 smoke test 失败";
  detailsEl.hidden = false;
  detailsEl.textContent = error instanceof Error ? error.stack || error.message : String(error);
  window.__TRANS2FORMER_BROWSER_SMOKE__ = {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
  throw error;
}
