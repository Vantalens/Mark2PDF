export class AssetStore {
  constructor(initialAssets = []) {
    this.assets = new Map();
    this.loaders = new Map();
    for (const asset of initialAssets) {
      this.add(asset);
    }
  }

  add({ id, name = "", mime = "application/octet-stream", data = "", size = 0, role = "attachment", loaded = true } = {}) {
    const assetId = id || crypto.randomUUID?.() || `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const asset = {
      id: assetId,
      name: String(name || assetId),
      mime: String(mime || "application/octet-stream"),
      data: String(data || ""),
      size: Number(size) || 0,
      role: String(role || "attachment"),
      loaded: Boolean(loaded || data),
    };
    this.assets.set(assetId, asset);
    return asset;
  }

  addLazy({ load, ...asset } = {}) {
    if (typeof load !== "function") {
      throw new Error("Lazy asset requires a load function");
    }
    const record = this.add({ ...asset, data: "", loaded: false });
    this.loaders.set(record.id, load);
    return record;
  }

  async resolve(id) {
    const asset = this.get(id);
    if (!asset) return null;
    if (asset.loaded) return asset;
    const loader = this.loaders.get(asset.id);
    if (!loader) return asset;
    asset.data = String(await loader(asset));
    asset.loaded = true;
    this.loaders.delete(asset.id);
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
