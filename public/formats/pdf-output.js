import { bytesToDataUrl, textToBytes } from "../core/binary-utils.js";
import { getPlainText } from "../core/document-model.js";

function escapePdfText(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function linesForPdf(model) {
  const text = getPlainText(model).replace(/\r\n?/g, "\n");
  const lines = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const chunks = line.match(/.{1,80}/g) || [line];
    lines.push(...chunks);
  }
  return lines.slice(0, 44);
}

function buildPdfBytes(model, title) {
  const lines = linesForPdf(model);
  const content = [
    "BT",
    "/F1 12 Tf",
    "72 760 Td",
    "16 TL",
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${textToBytes(content).length} >>\nstream\n${content}\nendstream`,
    `<< /Title (${escapePdfText(title)}) /Producer (Trans2Former) >>`,
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(textToBytes(output).length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = textToBytes(output).length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return textToBytes(output);
}

export function writePdfBinary({ model, title = model.title }) {
  const bytes = buildPdfBytes(model, title);
  return {
    type: "binary",
    format: "pdf",
    data: bytesToDataUrl(bytes, "application/pdf"),
    mime: "application/pdf",
  };
}
