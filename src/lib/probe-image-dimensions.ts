type ImageDims = { width: number; height: number } | null;

function u16be(buf: Buffer, offset: number) {
  return buf.readUInt16BE(offset);
}

function u32be(buf: Buffer, offset: number) {
  return buf.readUInt32BE(offset);
}

export function probeImageDimensions(buffer: Buffer, mimeTypeHint: string | null | undefined): ImageDims {
  if (!buffer || buffer.length < 24) return null;
  const mt = (mimeTypeHint ?? "").toLowerCase();
  try {
    const b0 = buffer[0];
    const b1 = buffer[1];
    const b2 = buffer[2];
    const b3 = buffer[3];

    if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) {
      if (buffer.length < 24) return null;
      return { width: u32be(buffer, 16), height: u32be(buffer, 20) };
    }

    if (b0 === 0xff && b1 === 0xd8) {
      let off = 2;
      while (off + 9 < buffer.length) {
        if (buffer[off] !== 0xff) break;
        let marker = buffer[off + 1];
        while (marker === 0xff && off + 2 < buffer.length) {
          off += 1;
          marker = buffer[off + 1];
        }
        if (marker === 0xd8 || marker === 0xd9) {
          off += 2;
          continue;
        }
        if (off + 4 > buffer.length) break;
        const segLen = u16be(buffer, off + 2);
        if (!segLen || segLen < 2) break;
        const segEnd = off + 2 + segLen;
        if (segEnd > buffer.length) break;
        if (
          marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3 ||
          marker === 0xc5 || marker === 0xc6 || marker === 0xc7 || marker === 0xc9 ||
          marker === 0xca || marker === 0xcb || marker === 0xcd || marker === 0xce || marker === 0xcf
        ) {
          if (off + 9 > buffer.length) break;
          const height = u16be(buffer, off + 5);
          const width = u16be(buffer, off + 7);
          return { width, height };
        }
        off = segEnd;
      }
    }

    if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46) {
      if (buffer.length < 10) return null;
      const w = buffer.readUInt16LE(6);
      const h = buffer.readUInt16LE(8);
      return { width: w, height: h };
    }

    if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46 && buffer.length >= 26) {
      if (buffer.toString("ascii", 8, 12) === "WEBP" && buffer.toString("ascii", 12, 16) === "VP8 ") {
        const w = buffer.readUIntLE(26, 3) & 0x3fff;
        const h = buffer.readUIntLE(29, 3) & 0x3fff;
        return { width: w, height: h };
      }
    }

    if (mt.includes("png")) return null;
    if (mt.includes("jpeg") || mt.includes("jpg")) return null;
  } catch {
    return null;
  }
  return null;
}
