import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import express from "express";

import { renderMarkdownBody, renderMarkdownHtml, renderMarkdownToPdfBuffer } from "./renderer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

function getTitleFromName(name) {
  const safeName = String(name || "document");
  return path.basename(safeName, path.extname(safeName)) || "document";
}

function getSafePdfFileName(title) {
  return String(title || "document")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .trim() || "document";
}

function createApp() {
  const app = express();

  app.use(express.json({ limit: "100mb" }));
  app.use(express.static(publicDir));

  function getBaseHrefFromSourcePath(sourcePathValue) {
    const sourcePath = String(sourcePathValue || "").trim();
    if (!sourcePath || !path.isAbsolute(sourcePath)) {
      return "";
    }
    return `${pathToFileURL(path.dirname(sourcePath)).toString()}/`;
  }

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/render-html", async (req, res) => {
    try {
      const markdown = String(req.body?.markdown ?? "");
      const title = getTitleFromName(req.body?.filename);
      const baseHref = getBaseHrefFromSourcePath(req.body?.sourcePath);
      const bodyHtml = await renderMarkdownBody(markdown);

      const html = await renderMarkdownHtml({
        markdownRaw: markdown,
        title,
        baseHref,
      });

      res.json({ title, html, bodyHtml });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/pdf", async (req, res) => {
    try {
      const markdown = String(req.body?.markdown ?? "");
      const title = getTitleFromName(req.body?.filename);
      const format = String(req.body?.format || "A4").toUpperCase();
      const baseHref = getBaseHrefFromSourcePath(req.body?.sourcePath);

      if (!["A4", "LETTER"].includes(format)) {
        res.status(400).json({ error: "format 仅支持 A4 或 Letter" });
        return;
      }

      const pdfBuffer = await renderMarkdownToPdfBuffer({
        markdownRaw: markdown,
        title,
        baseHref,
        pdfOptions: {
          format,
        },
      });

      const safeFileName = getSafePdfFileName(title);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${safeFileName}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("*", async (_req, res) => {
    const indexPath = path.join(publicDir, "index.html");
    const html = await fs.readFile(indexPath, "utf8");
    res.type("html").send(html);
  });

  return app;
}

export async function startWebServer(port = Number(process.env.PORT || 3000)) {
  const app = createApp();

  return await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({ app, server, port: actualPort });
    });

    server.on("error", reject);
  });
}
