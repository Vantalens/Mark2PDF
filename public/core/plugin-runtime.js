import {
  assertPluginModeAllows,
  computeSha256Hex,
  getPluginModePolicy,
  validatePluginManifest,
  verifyPluginIntegrity,
} from "./plugin-policy.js";
import { createDocumentModel, createParagraph } from "./document-model.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getReleaseUrl(manifest) {
  return manifest.releaseUrl || manifest.distribution?.releaseUrl || "";
}

export function createPluginRecord(manifest, { integrityVerified = false, source = "local-import" } = {}) {
  const validation = validatePluginManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Invalid plugin manifest: ${validation.errors.join("; ")}`);
  }
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    kind: manifest.kind,
    status: integrityVerified ? "installed" : "blocked",
    enabled: false,
    source,
    releaseUrl: getReleaseUrl(manifest),
    manifest: clone(manifest),
    integrityVerified,
    capabilities: discoverPluginCapabilities({ manifest }),
    rollback: [{ version: manifest.version, manifest: clone(manifest) }],
    lastError: "",
  };
}

export function openPluginRelease(manifest, { openExternal = globalThis.open, documentContext = null } = {}) {
  const policy = getPluginModePolicy("install");
  assertPluginModeAllows(manifest, "install", "install-network");
  const releaseUrl = getReleaseUrl(manifest);
  if (!releaseUrl) {
    throw new Error("Plugin releaseUrl is required");
  }
  if (typeof openExternal === "function") {
    openExternal(releaseUrl, "_blank", "noopener,noreferrer");
  }
  return {
    mode: "install",
    canAccessDocuments: policy.canAccessDocuments,
    canUseNetwork: policy.canUseNetwork,
    documentFieldsRead: documentContext ? [] : [],
    releaseUrl,
  };
}

export async function importLocalPluginPackage({ manifest, bytes }) {
  const validation = validatePluginManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Plugin manifest rejected: ${validation.errors.join("; ")}`);
  }
  if (!await verifyPluginIntegrity(manifest, bytes)) {
    throw new Error("Plugin integrity check failed");
  }
  return createPluginRecord(manifest, { integrityVerified: true });
}

export function setPluginEnabled(record, enabled) {
  if (enabled && !record.integrityVerified) {
    throw new Error("Plugin cannot be enabled until integrity is verified");
  }
  return {
    ...record,
    enabled: Boolean(enabled),
    status: enabled ? "enabled" : "disabled",
  };
}

export function uninstallPlugin(record) {
  return {
    ...record,
    enabled: false,
    status: "uninstalled",
  };
}

export function rollbackPlugin(record) {
  const previous = record.rollback?.[0];
  if (!previous) {
    throw new Error("No rollback version is available");
  }
  return createPluginRecord(previous.manifest, {
    integrityVerified: record.integrityVerified,
    source: record.source,
  });
}

export function discoverPluginCapabilities(record) {
  const manifest = record.manifest || record;
  const policy = getPluginModePolicy("processing");
  return (manifest.formats || []).map((format) => ({
    pluginId: manifest.id,
    pluginName: manifest.name,
    format: format.format,
    canRead: Boolean(format.canRead),
    canWrite: Boolean(format.canWrite),
    kind: manifest.kind,
    mode: manifest.security?.processingMode || "local-only-no-network",
    permissions: (manifest.permissions || []).filter((permission) => policy.allowedPermissions.includes(permission)),
    resources: manifest.resources || {},
    fallback: manifest.fallback || null,
  }));
}

function createBlockedNetwork() {
  return {
    request() {
      const error = new Error("Plugin processing mode forbids network access");
      error.code = "PLUGIN_NETWORK_BLOCKED";
      throw error;
    },
  };
}

function bytesToText(bytes) {
  if (typeof bytes === "string") return bytes;
  return new TextDecoder().decode(bytes);
}

function textToBase64(text) {
  if (typeof Buffer !== "undefined") return Buffer.from(text, "utf8").toString("base64");
  return btoa(unescape(encodeURIComponent(text)));
}

function withTimeout(promise, timeoutMs) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Plugin execution timed out");
      error.code = "PLUGIN_TIMEOUT";
      reject(error);
    }, Math.max(1, Number(timeoutMs) || 5000));
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function createFixturePluginPackage() {
  const source = `
export async function transform({ input, network }) {
  if (input?.mode === "network") network.request("https" + "://example.com/blocked");
  if (input?.mode === "crash") throw new Error("fixture plugin crash");
  return {
    schemaVersion: "trans2former.document.v1",
    title: "Fixture Plugin Result",
    sourceFormat: "fixture",
    blocks: [{ type: "paragraph", text: "fixture plugin processed " + (input?.text || "document") }],
    assets: [],
    metadata: { plugin: { id: "fixture-local-transform", sandbox: "worker-module" } }
  };
}
`.trim();
  const bytes = new TextEncoder().encode(source);
  const hash = await computeSha256Hex(bytes);
  return {
    bytes,
    manifest: {
      schemaVersion: "trans2former.plugin.v1",
      id: "fixture-local-transform",
      name: "Fixture Local Transform",
      version: "1.0.0",
      kind: "format-plugin",
      entry: "entry.js",
      releaseUrl: "https" + "://github.com/Vantalens/trans2former-fixture-plugin/releases/tag/v1.0.0",
      formats: [{ format: "fixture", canRead: true, canWrite: true }],
      permissions: ["process-document", "read-assets", "write-output"],
      resources: { downloadBytes: bytes.length, maxRuntimeMemoryMb: 128 },
      integrity: { sha256: hash },
      security: { installMode: "network-only-no-documents", processingMode: "local-only-no-network" },
      fallback: {
        code: "FIXTURE_PLUGIN_FALLBACK",
        message: "Fixture plugin failed; preserve current user input and output state.",
      },
      updates: {
        latestVersion: "1.0.1",
        releaseNotes: "Fixture update for loader regression tests.",
        permissions: ["process-document", "read-assets", "write-output"],
        resources: { downloadBytes: bytes.length + 128, maxRuntimeMemoryMb: 128 },
      },
    },
  };
}

export async function runPluginProcessingTask(record, { input, execute }) {
  if (!record.enabled) {
    return {
      ok: false,
      error: { code: "PLUGIN_DISABLED", message: "Plugin is disabled." },
      fallback: record.manifest?.fallback || null,
      outputPreserved: true,
    };
  }
  try {
    assertPluginModeAllows(record.manifest, "processing", "process-document");
    const output = await execute({
      input,
      network: createBlockedNetwork(),
      capabilities: discoverPluginCapabilities(record),
    });
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error.code === "PLUGIN_NETWORK_BLOCKED" ? "PLUGIN_NETWORK_BLOCKED" : "PLUGIN_CRASH_ISOLATED",
        message: error.message,
      },
      fallback: record.manifest?.fallback || null,
      outputPreserved: true,
    };
  }
}

export async function runPluginModuleTask(record, { packageBytes, input, timeoutMs = 5000 } = {}) {
  if (!record.enabled) {
    return {
      ok: false,
      error: { code: "PLUGIN_DISABLED", message: "Plugin is disabled." },
      fallback: record.manifest?.fallback || null,
      outputPreserved: true,
    };
  }
  try {
    assertPluginModeAllows(record.manifest, "processing", "process-document");
    if (!await verifyPluginIntegrity(record.manifest, packageBytes)) {
      throw Object.assign(new Error("Plugin integrity check failed"), { code: "PLUGIN_INTEGRITY_FAILED" });
    }
    const source = bytesToText(packageBytes);
    const moduleUrl = `data:text/javascript;base64,${textToBase64(source)}`;
    const pluginModule = await import(moduleUrl);
    if (typeof pluginModule.transform !== "function") {
      throw Object.assign(new Error("Plugin entry must export transform()"), { code: "PLUGIN_ENTRY_INVALID" });
    }
    const output = await withTimeout(pluginModule.transform({
      input,
      network: createBlockedNetwork(),
      capabilities: discoverPluginCapabilities(record),
      createDocumentModel,
      createParagraph,
    }), timeoutMs);
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error.code === "PLUGIN_NETWORK_BLOCKED" || error.code === "PLUGIN_TIMEOUT" || error.code === "PLUGIN_INTEGRITY_FAILED"
          ? error.code
          : "PLUGIN_CRASH_ISOLATED",
        message: error.message,
      },
      fallback: record.manifest?.fallback || null,
      outputPreserved: true,
    };
  }
}
