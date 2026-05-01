import { concatBytes, crc32, textToBytes, uint16, uint32 } from "./binary-utils.js";

export function writeStoredZip(entries) {
  const localChunks = [];
  const centralChunks = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBytes = textToBytes(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : textToBytes(entry.data);
    const crc = crc32(data);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
    ]);
    localChunks.push(localHeader, nameBytes, data);

    centralChunks.push(new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(localOffset),
    ]), nameBytes);

    localOffset += localHeader.length + nameBytes.length + data.length;
  }

  const centralOffset = localOffset;
  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const endOfCentralDirectory = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(entries.length),
    ...uint16(entries.length),
    ...uint32(centralSize),
    ...uint32(centralOffset),
    ...uint16(0),
  ]);

  return concatBytes([...localChunks, ...centralChunks, endOfCentralDirectory]);
}
