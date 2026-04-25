import { createDocumentModel, createTable } from "../core/document-model.js";
import { getPlainText } from "../core/document-model.js";

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function readCsv({ content, title = "table", format = "csv" }) {
  const lines = String(content ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const rows = lines.map(parseCsvLine);
  const headers = rows.shift() || [];
  return createDocumentModel({
    title,
    sourceFormat: format,
    blocks: [createTable(headers, rows)],
  });
}

export function writeCsv({ model }) {
  const table = model.blocks.find((block) => block.type === "table");
  let rows;
  if (table) {
    rows = [table.headers, ...table.rows];
  } else {
    rows = [["Text"], ...getPlainText(model).split(/\n{2,}/).filter(Boolean).map((text) => [text])];
  }

  return {
    type: "text",
    format: "csv",
    data: `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`,
    mime: "text/csv;charset=utf-8",
  };
}