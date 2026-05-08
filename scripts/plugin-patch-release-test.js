import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { TRUSTED_PLUGIN_CATALOG } from "../public/plugin-catalog.js";
import { validatePluginManifest, verifyPluginIntegrity } from "../public/core/plugin-policy.js";
import { importLocalPluginPackage } from "../public/core/plugin-runtime.js";

const expectedAssets = [
  "public/plugin-patches/ofd-local-reader-0.2.0.t2f-plugin.json",
  "public/plugin-patches/local-ocr-basic-0.1.0.t2f-plugin.json",
];

for (const asset of expectedAssets) {
  const pluginPackage = JSON.parse(await readFile(asset, "utf8"));
  assert.equal(pluginPackage.packageType, "trans2former.plugin.patch.v1", `${asset} should be a plugin patch package`);
  assert.equal(typeof pluginPackage.entrySource, "string", `${asset} should contain entrySource`);
  const bytes = new TextEncoder().encode(pluginPackage.entrySource);
  const validation = validatePluginManifest(pluginPackage.manifest);
  assert.equal(validation.ok, true, `${asset} manifest invalid: ${validation.errors.join("; ")}`);
  assert.equal(await verifyPluginIntegrity(pluginPackage.manifest, bytes), true, `${asset} integrity should match entrySource`);
  const record = await importLocalPluginPackage({ manifest: pluginPackage.manifest, bytes });
  assert.equal(record.integrityVerified, true, `${asset} should be importable as a local plugin package`);
  assert.equal(record.source, "local-import");
}

for (const plugin of TRUSTED_PLUGIN_CATALOG) {
  assert.equal(plugin.distribution?.channel, "release-asset", `${plugin.id} should download from release assets`);
  assert.equal(plugin.distribution?.packageType, "trans2former.plugin.patch.v1", `${plugin.id} should use plugin patch packages`);
  assert.equal(plugin.distribution?.offlineInstall, true, `${plugin.id} should support offline release install`);
  assert.match(plugin.releaseUrl, /^\/plugin-patches\/.+\.t2f-plugin\.json$/, `${plugin.id} should point to a release patch asset`);
}

console.log("Plugin patch release test passed: trusted plugins are packaged as release assets and import with verified integrity.");
