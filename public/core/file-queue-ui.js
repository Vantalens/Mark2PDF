import { createQueueItem } from "./workbench-state.js";

export function formatFileSize(bytes) {
  if (!bytes) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function renderFileQueue({ listElement, fileQueue, activeQueueItemId, onActivate }) {
  if (!listElement) {
    return;
  }
  if (!fileQueue.length) {
    listElement.innerHTML = '<div class="queue-empty">暂无队列文件</div>';
    return;
  }

  listElement.replaceChildren(...fileQueue.map((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `queue-item${item.id === activeQueueItemId ? " is-active" : ""}`;
    row.dataset.queueId = item.id;

    const check = document.createElement("span");
    check.className = "queue-check";
    check.textContent = item.selected ? "✓" : "";

    const name = document.createElement("span");
    name.className = "queue-name";
    name.textContent = item.name;

    const meta = document.createElement("span");
    meta.className = "queue-meta";
    meta.textContent = `${item.format || "?"} · ${formatFileSize(item.size)}`;

    const status = document.createElement("span");
    status.className = "queue-status";
    status.dataset.status = item.status;
    status.textContent = item.status;

    row.append(check, name, meta, status);
    row.addEventListener("click", () => onActivate?.(item.id));
    return row;
  }));
}

export function registerQueuedFileState(fileQueue, activeQueueItemId, file, detectedFormat) {
  const existing = fileQueue.find((item) => item.name === file.name && item.size === file.size);
  if (existing) {
    existing.selected = true;
    existing.format = detectedFormat || existing.format;
    return {
      fileQueue,
      activeQueueItemId: existing.id,
      item: existing,
    };
  }

  const item = createQueueItem(file, detectedFormat);
  return {
    fileQueue: [...fileQueue, item],
    activeQueueItemId: item.id,
    item,
  };
}

export function selectAllQueueItemsState(fileQueue) {
  const shouldSelect = fileQueue.some((item) => !item.selected);
  return fileQueue.map((item) => ({ ...item, selected: shouldSelect }));
}

export function retryFailedQueueItemsState(fileQueue) {
  let retries = 0;
  const nextQueue = fileQueue.map((item) => {
    if (item.status !== "failed") {
      return item;
    }
    retries += 1;
    return { ...item, selected: true, status: "queued", error: "" };
  });
  return { fileQueue: nextQueue, retries };
}
