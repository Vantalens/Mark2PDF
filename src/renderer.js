import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import markdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import texmath from "markdown-it-texmath";
import katex from "katex";
import hljs from "highlight.js";
import { chromium } from "playwright";

const DEFAULT_PDF_OPTIONS = {
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false,
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let markdownEngine;
let sharedCssPromise;

function buildMarkdownEngine() {
  const md = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
      }
      const highlighted = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
    },
  });

  md.use(anchor, {
    permalink: false,
  });
  md.use(footnote);
  md.use(taskLists, { enabled: true, label: true, labelAfter: true });
  md.use(texmath, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: {
      throwOnError: false,
      strict: "ignore",
      output: "htmlAndMathml",
      trust: false,
    },
  });

  return md;
}

async function readFileUtf8(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function loadKatexCss(rootDir) {
  const katexCssPath = path.join(rootDir, "node_modules", "katex", "dist", "katex.min.css");
  const katexFontsDir = path.join(rootDir, "node_modules", "katex", "dist", "fonts");

  let css = await readFileUtf8(katexCssPath);
  css = css.replace(/url\(fonts\/([^\)]+)\)/g, (_, fontFile) => {
    const absoluteFont = path.join(katexFontsDir, fontFile.replace(/['\"]/g, ""));
    const fontUrl = pathToFileURL(absoluteFont).toString();
    return `url('${fontUrl}')`;
  });

  return css;
}

async function loadHighlightCss(rootDir) {
  const cssPath = path.join(rootDir, "node_modules", "highlight.js", "styles", "github.min.css");
  return readFileUtf8(cssPath);
}

function buildHtmlDocument({ title, bodyHtml, cssBlocks, baseHref = "" }) {
  const cssJoined = cssBlocks.join("\n\n");
  const safeTitle = String(title ?? "Document")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const safeBaseHref = String(baseHref)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const baseTag = safeBaseHref ? `<base href="${safeBaseHref}" />` : "";
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    ${baseTag}
    <style>${cssJoined}</style>
  </head>
  <body>
    <main>
      ${bodyHtml}
    </main>
  </body>
</html>`;
}

async function getMarkdownEngine() {
  if (!markdownEngine) {
    markdownEngine = buildMarkdownEngine();
  }
  return markdownEngine;
}

async function getSharedCssBlocks() {
  if (!sharedCssPromise) {
    sharedCssPromise = Promise.all([
      loadHighlightCss(projectRoot),
      loadKatexCss(projectRoot),
      readFileUtf8(path.join(projectRoot, "src", "template.css")),
    ]);
  }
  return sharedCssPromise;
}

async function renderPdfBufferWithElectron(html, pdfOptions) {
  if (!process.versions.electron) {
    return null;
  }

  try {
    const electronModule = await import("electron");
    const BrowserWindow = electronModule?.BrowserWindow;

    if (!BrowserWindow) {
      return null;
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mark2pdf-"));
    const tempHtmlPath = path.join(tempDir, "document.html");
    await fs.writeFile(tempHtmlPath, html, "utf8");

    const window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 1697,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    try {
      await window.loadFile(tempHtmlPath);
      await window.webContents.executeJavaScript(
        "document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()"
      );

      const pageSize = String(pdfOptions?.format || pdfOptions?.pageSize || "A4").toUpperCase();

      return await window.webContents.printToPDF({
        printBackground: true,
        pageSize,
      });
    } finally {
      window.destroy();
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  } catch (error) {
    if (process.versions.electron) {
      throw new Error(`Electron PDF 渲染失败: ${error.message}`);
    }
    return null;
  }
}

export async function renderMarkdownBody(markdownRaw) {
  const md = await getMarkdownEngine();
  return md.render(String(markdownRaw ?? ""));
}

export async function renderMarkdownHtml({ markdownRaw, title, baseHref = "" }) {
  const bodyHtml = await renderMarkdownBody(markdownRaw);
  const cssBlocks = await getSharedCssBlocks();
  return buildHtmlDocument({
    title,
    bodyHtml,
    cssBlocks,
    baseHref,
  });
}

export async function renderMarkdownToPdfBuffer({ markdownRaw, title, pdfOptions = {}, baseHref = "" }) {
  const html = await renderMarkdownHtml({ markdownRaw, title, baseHref });

  if (process.versions.electron) {
    return await renderPdfBufferWithElectron(html, pdfOptions);
  }

  const electronBuffer = await renderPdfBufferWithElectron(html, pdfOptions);
  if (electronBuffer) {
    return electronBuffer;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 1697 },
      deviceScaleFactor: 1.5,
    });

    await page.setContent(html, { waitUntil: "networkidle" });

    // Wait for webfonts to be available before printing for stable glyph output.
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    return await page.pdf({
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions,
    });
  } finally {
    await browser.close();
  }
}

export async function renderMarkdownToPdf({
  inputPath,
  outputPath,
  cssPath,
  pdfOptions = {},
}) {
  const markdownRaw = await readFileUtf8(inputPath);
  const title = path.basename(inputPath, path.extname(inputPath));
  const baseHref = `${pathToFileURL(path.dirname(inputPath)).toString()}/`;
  const pdfBuffer = await renderMarkdownToPdfBuffer({ markdownRaw, title, pdfOptions, baseHref });
  await fs.writeFile(outputPath, pdfBuffer);
}
