// AssetGraph：跨模型共享的资产容器。
//
// P8 多模型架构下，SemanticDoc / WorkbookModel / SlideModel / FixedLayoutModel
// 都可能引用同一份资产（图片、字体、媒体、附件）。AssetGraph 把资产抽到顶层，
// 按内容 hash 去重，并记录每个资产被哪些模型块引用、来自哪个 reader / 文件 /
// 页面（provenance）。
//
// 现阶段（P8-M2）作为 AssetStore 的轻量包装：单模型场景下行为不变；多模型场景
// 通过 mergeFrom 合并不同模型的资产，hash 相同时只保留一份。详见
// docs/MULTI_MODEL_ARCHITECTURE.md AssetGraph 章节。

import { AssetStore } from "../asset-store.js";

export class AssetGraph {
  constructor(initialAssets = []) {
    this.store = new AssetStore(initialAssets);
    this.referencesByAssetId = new Map();   // assetId -> Set<blockId/owner string>
    this.provenanceByAssetId = new Map();   // assetId -> { reader, fileName, page, sourceRef }
    this.hashIndex = new Map();             // hash -> assetId（去重）
  }

  add(asset, { reader = "", fileName = "", page = null, sourceRef = "", referencedBy = "" } = {}) {
    const hash = String(asset?.hash || "");
    if (hash && this.hashIndex.has(hash)) {
      const existingId = this.hashIndex.get(hash);
      if (referencedBy) this._addReference(existingId, referencedBy);
      return this.store.get(existingId);
    }
    const record = this.store.add(asset);
    if (hash) this.hashIndex.set(hash, record.id);
    this.provenanceByAssetId.set(record.id, {
      reader: String(reader || ""),
      fileName: String(fileName || ""),
      page: page === null || page === undefined ? null : Number(page),
      sourceRef: String(sourceRef || ""),
    });
    if (referencedBy) this._addReference(record.id, referencedBy);
    return record;
  }

  addLazy(asset, options = {}) {
    const record = this.store.addLazy(asset);
    this.provenanceByAssetId.set(record.id, {
      reader: String(options.reader || ""),
      fileName: String(options.fileName || ""),
      page: options.page === null || options.page === undefined ? null : Number(options.page),
      sourceRef: String(options.sourceRef || ""),
    });
    if (options.referencedBy) this._addReference(record.id, options.referencedBy);
    return record;
  }

  async resolve(id) {
    return this.store.resolve(id);
  }

  get(id) {
    return this.store.get(id);
  }

  getProvenance(id) {
    return this.provenanceByAssetId.get(id) || null;
  }

  getReferences(id) {
    return [...(this.referencesByAssetId.get(id) || new Set())];
  }

  recordReference(assetId, owner) {
    this._addReference(assetId, owner);
  }

  list() {
    return this.store.list();
  }

  mergeFrom(otherGraph, { reader = "", fileName = "" } = {}) {
    if (!otherGraph) return;
    for (const asset of otherGraph.list()) {
      const provenance = otherGraph.getProvenance(asset.id) || {};
      this.add(asset, {
        reader: reader || provenance.reader,
        fileName: fileName || provenance.fileName,
        page: provenance.page,
        sourceRef: provenance.sourceRef,
      });
      for (const ref of otherGraph.getReferences(asset.id)) {
        this._addReference(asset.id, ref);
      }
    }
  }

  toJSON() {
    return this.list().map((asset) => ({
      ...asset,
      provenance: this.getProvenance(asset.id),
      references: this.getReferences(asset.id),
    }));
  }

  _addReference(assetId, owner) {
    let set = this.referencesByAssetId.get(assetId);
    if (!set) {
      set = new Set();
      this.referencesByAssetId.set(assetId, set);
    }
    set.add(String(owner));
  }
}

export function createAssetGraph(initialAssets = []) {
  return new AssetGraph(initialAssets);
}
