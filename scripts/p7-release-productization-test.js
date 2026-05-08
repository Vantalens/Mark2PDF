import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const tasks = await readFile("DEVELOPMENT_TASKS.md", "utf8");
const releasePlan = await readFile("docs/DESKTOP_RELEASE_PLAN.md", "utf8");
const releasePrep = await readFile("docs/RELEASE_PREP.md", "utf8");
const distribution = await readFile("docs/PLUGIN_DISTRIBUTION.md", "utf8");
const prepareRelease = await readFile("scripts/prepare-release.js", "utf8");
const tauriConfig = await readFile("src-tauri/tauri.conf.json", "utf8");
const docsIndex = await readFile("docs/README.md", "utf8");

for (const expected of [
  "Trans2Former_<version>_windows_x64.msi",
  "checksums.sha256",
  "Windows WebView2",
  "macOS WKWebView",
  "Linux WebKitGTK",
  "文件关联",
  "自动更新",
  "plugin-patches",
  ".t2f-plugin.json",
]) {
  assert.equal(releasePlan.includes(expected), true, `desktop release plan should mention ${expected}`);
}

for (const expected of ["plugin-patches/*.t2f-plugin.json", "DESKTOP_RELEASE_PLAN.md", "release asset"]) {
  assert.equal(releasePrep.includes(expected), true, `release prep should mention ${expected}`);
}

for (const expected of ["trans2former.plugin.patch.v1", "用户按需下载", "entrySource", "SHA-256"]) {
  assert.equal(distribution.includes(expected), true, `plugin distribution should mention ${expected}`);
}

assert.equal(prepareRelease.includes("pluginPatchAssets"), true, "release manifest should include plugin patch assets");
assert.equal(prepareRelease.includes("plugin-patches"), true, "release prepare should copy plugin patch packages");
assert.equal(tauriConfig.includes('"targets": "all"'), true, "Tauri bundle should keep all platform targets declared");
assert.equal(tauriConfig.includes("connect-src 'self'"), true, "desktop CSP should keep network scope local-only by default");
assert.equal(docsIndex.includes("DESKTOP_RELEASE_PLAN.md"), true, "docs index should expose P7 release plan");
assert.equal(tasks.includes("状态：已完成，平台安装包待真实构建环境产出。"), true, "P7 task status should reflect release productization completion");

console.log("P7 release productization test passed: desktop release, plugin patch, and docs gates are covered.");
