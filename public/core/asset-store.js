export class AssetStore {
  constructor(initialAssets = []) {
    this.assets = new Map();
    for (const asset of initialAssets) {
      this.add(asset);
    }
  }

  add({ id, name = "", mime = "application/octet-stream", data = "", size = 0, role = "attachment" } = {}) {
    const assetId = id || crypto.randomUUID?.() || `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const asset = {
      id: assetId,
      name: String(name || assetId),
      mime: String(mime || "application/octet-stream"),
      data: String(data || ""),
      size: Number(size) || 0,
      role: String(role || "attachment"),
    };
    this.assets.set(assetId, asset);
    return asset;
  }

  get(id) {
    return this.assets.get(id) || null;
  }

  list() {
    return [...this.assets.values()];
  }

  toJSON() {
    return this.list();
  }
}

export function createAssetStore(initialAssets = []) {
  return new AssetStore(initialAssets);
}