import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

function createApp() {
  const app = express();

  app.use(express.static(publicDir));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: "browser-first" });
  });

  app.get("*", async (_req, res) => {
    const indexPath = path.join(publicDir, "index.html");
    const html = await fs.readFile(indexPath, "utf8");
    res.type("html").send(html);
  });

  return app;
}

export async function startWebServer(port = Number(process.env.PORT || 3000)) {
  const serverStartTime = Date.now();
  const app = createApp();

  return await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const elapsed = Date.now() - serverStartTime;
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      console.log(`[STARTUP] Web server listening: ${elapsed}ms`);
      resolve({ app, server, port: actualPort });
    });

    server.on("error", reject);
  });
}
