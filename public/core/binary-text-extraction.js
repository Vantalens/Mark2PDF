import { decodeTextBytes } from "./text-decoding.js";

function base64ToBytes(base64) {
  if (typeof atob === "function") {
    const binary = atob(base64);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  return new Uint8Array();
}

function coerceBinaryBytes(content) {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  if (ArrayBuffer.isView(content)) {
    return new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
  }
  const text = String(content ?? "");
  const dataUrlMatch = text.match(/^data:[^;]+;base64,(.+)$/);
  if (dataUrlMatch) {
    return base64ToBytes(dataUrlMatch[1]);
  }
  return new TextEncoder().encode(text);
}

function pushTextCode(buffer, code) {
  if (code === 9) {
    buffer.push(" ");
    return;
  }
  if (code === 10 || code === 13) {
    buffer.push("\n");
    return;
  }
  buffer.push(String.fromCharCode(code));
}

function normalizeCandidateText(text) {
  return String(text ?? "")
    .replace(/\u0000+/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function scoreCandidateText(text) {
  const cleaned = normalizeCandidateText(text);
  if (!cleaned) {
    return -Infinity;
  }
  const readable = (cleaned.match(/[A-Za-z0-9\u3400-\u9fff]/g) || []).length;
  const whitespace = (cleaned.match(/[\n\s]/g) || []).length;
  const control = (String(text).match(/[\u0000-\u0008\u000B-\u001F]/g) || []).length;
  const noise = (cleaned.match(/[^A-Za-z0-9\u3400-\u9fff\n\s.,:;!?()\-_/]/g) || []).length;
  return readable * 4 + whitespace * 2 - control * 10 - noise * 8 + Math.min(cleaned.length, 4096) * 0.2;
}

function scanAsciiRuns(bytes, minLength = 12) {
  const runs = [];
  let buffer = [];
  for (const byte of bytes) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)) {
      pushTextCode(buffer, byte);
      continue;
    }
    if (buffer.length >= minLength) {
      runs.push(normalizeCandidateText(buffer.join("")));
    }
    buffer = [];
  }
  if (buffer.length >= minLength) {
    runs.push(normalizeCandidateText(buffer.join("")));
  }
  return runs.filter(Boolean);
}

function scanUtf16Runs(bytes, littleEndian = true, minLength = 8) {
  const runs = [];
  for (const startOffset of [0, 1]) {
    let buffer = [];
    for (let index = startOffset; index + 1 < bytes.length; index += 2) {
      const low = littleEndian ? bytes[index] : bytes[index + 1];
      const high = littleEndian ? bytes[index + 1] : bytes[index];
      if (high !== 0) {
        if (buffer.length >= minLength) {
          runs.push(normalizeCandidateText(buffer.join("")));
        }
        buffer = [];
        continue;
      }
      const code = littleEndian ? low : low;
      if (code === 0) {
        if (buffer.length >= minLength) {
          runs.push(normalizeCandidateText(buffer.join("")));
        }
        buffer = [];
        continue;
      }
      if (code === 9 || code === 10 || code === 13 || code >= 32) {
        pushTextCode(buffer, code);
        continue;
      }
      if (buffer.length >= minLength) {
        runs.push(normalizeCandidateText(buffer.join("")));
      }
      buffer = [];
    }
    if (buffer.length >= minLength) {
      runs.push(normalizeCandidateText(buffer.join("")));
    }
  }
  return runs.filter(Boolean);
}

export function extractReadableTextFromBinary(content, { fileName = "", mime = "", format = "doc" } = {}) {
  const bytes = coerceBinaryBytes(content);
  const decoded = decodeTextBytes(bytes, { fileName, mime });
  const candidates = [
    decoded.text,
    ...scanAsciiRuns(bytes),
    ...scanUtf16Runs(bytes, true),
    ...scanUtf16Runs(bytes, false),
  ]
    .map((text) => normalizeCandidateText(text))
    .filter(Boolean);

  const scored = [...new Set(candidates)]
    .map((text) => ({ text, score: scoreCandidateText(text) }))
    .filter((item) => item.score > -Infinity)
    .sort((a, b) => b.score - a.score || b.text.length - a.text.length);

  const best = scored[0] || { text: normalizeCandidateText(decoded.text), score: scoreCandidateText(decoded.text) };
  return {
    text: best.text,
    source: best.text === normalizeCandidateText(decoded.text) ? decoded.encoding || format : "binary-runs",
    byteLength: bytes.length,
    candidateCount: scored.length,
  };
}
