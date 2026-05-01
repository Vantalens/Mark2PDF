import { adler32, bytesToDataUrl, concatBytes, crc32, textToBytes, uint16, uint32be } from "../core/binary-utils.js";
import { getPlainText } from "../core/document-model.js";

function pngChunk(type, data) {
  const typeBytes = textToBytes(type);
  return concatBytes([
    new Uint8Array(uint32be(data.length)),
    typeBytes,
    data,
    new Uint8Array(uint32be(crc32(concatBytes([typeBytes, data])))),
  ]);
}

function zlibStore(bytes) {
  const chunks = [new Uint8Array([0x78, 0x01])];
  let offset = 0;
  while (offset < bytes.length) {
    const length = Math.min(65535, bytes.length - offset);
    const final = offset + length >= bytes.length ? 1 : 0;
    chunks.push(new Uint8Array([final, ...uint16(length), ...uint16((~length) & 0xffff)]));
    chunks.push(bytes.slice(offset, offset + length));
    offset += length;
  }
  chunks.push(new Uint8Array(uint32be(adler32(bytes))));
  return concatBytes(chunks);
}

function renderModelPixels(model) {
  const width = 900;
  const height = 1200;
  const pixels = new Uint8Array((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    pixels[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const index = row + 1 + x * 3;
      pixels[index] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
    }
  }

  const lines = getPlainText(model).split(/\r?\n/).filter(Boolean).slice(0, 42);
  lines.forEach((line, lineIndex) => {
    const y = 48 + lineIndex * 24;
    const widthHint = Math.min(760, Math.max(80, line.length * 8));
    for (let yy = y; yy < y + 10 && yy < height; yy += 1) {
      for (let x = 64; x < 64 + widthHint && x < width; x += 1) {
        const index = yy * (width * 3 + 1) + 1 + x * 3;
        pixels[index] = 31;
        pixels[index + 1] = 41;
        pixels[index + 2] = 55;
      }
    }
  });
  return { width, height, pixels };
}

function writePngBytes(model) {
  const { width, height, pixels } = renderModelPixels(model);
  const ihdr = new Uint8Array([
    ...uint32be(width),
    ...uint32be(height),
    8,
    2,
    0,
    0,
    0,
  ]);
  return concatBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlibStore(pixels)),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

function base64ToBytes(base64) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(base64, "base64"));
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const ONE_PIXEL_JPEG = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAARD/2gAIAQEAAT8QH//Z";

export function writePng({ model }) {
  const bytes = writePngBytes(model);
  return {
    type: "binary",
    format: "png",
    data: bytesToDataUrl(bytes, "image/png"),
    mime: "image/png",
  };
}

export function writeJpeg() {
  const bytes = base64ToBytes(ONE_PIXEL_JPEG);
  return {
    type: "binary",
    format: "jpeg",
    data: bytesToDataUrl(bytes, "image/jpeg"),
    mime: "image/jpeg",
  };
}
