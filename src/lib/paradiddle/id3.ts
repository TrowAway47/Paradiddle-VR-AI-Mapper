export type Id3Info = {
  title?: string;
  artist?: string;
  album?: string;
  picture?: { mime: string; data: Uint8Array };
};

function synchsafe(view: DataView, offset: number): number {
  return (
    ((view.getUint8(offset) & 0x7f) << 21) |
    ((view.getUint8(offset + 1) & 0x7f) << 14) |
    ((view.getUint8(offset + 2) & 0x7f) << 7) |
    (view.getUint8(offset + 3) & 0x7f)
  );
}

function decodeText(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const enc = bytes[0];
  const body = bytes.subarray(1);
  try {
    if (enc === 1) return new TextDecoder("utf-16").decode(body).replace(/\0/g, "").trim();
    if (enc === 2) return new TextDecoder("utf-16be").decode(body).replace(/\0/g, "").trim();
    if (enc === 3) return new TextDecoder("utf-8").decode(body).replace(/\0/g, "").trim();
    return new TextDecoder("latin1").decode(body).replace(/\0/g, "").trim();
  } catch {
    return new TextDecoder("latin1").decode(body).replace(/\0/g, "").trim();
  }
}

function cstr(bytes: Uint8Array, start: number, encoding = 0): { text: string; next: number } {
  if (encoding === 1 || encoding === 2) {
    for (let i = start; i + 1 < bytes.length; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) {
        const slice = bytes.subarray(start, i);
        const text =
          encoding === 1
            ? new TextDecoder("utf-16").decode(slice)
            : new TextDecoder("utf-16be").decode(slice);
        return { text: text.replace(/\0/g, ""), next: i + 2 };
      }
    }
  } else {
    let i = start;
    while (i < bytes.length && bytes[i] !== 0) i++;
    const text = new TextDecoder(encoding === 3 ? "utf-8" : "latin1").decode(bytes.subarray(start, i));
    return { text, next: Math.min(bytes.length, i + 1) };
  }
  return { text: "", next: bytes.length };
}

function parseApic(bytes: Uint8Array): Id3Info["picture"] | undefined {
  if (bytes.length < 4) return;
  const encoding = bytes[0] ?? 0;
  const mime = cstr(bytes, 1, 0);
  const typeOffset = mime.next;
  if (typeOffset >= bytes.length) return;
  const desc = cstr(bytes, typeOffset + 1, encoding);
  const data = bytes.subarray(desc.next);
  if (data.length < 16) return;
  return { mime: mime.text || "image/jpeg", data };
}

export function parseId3(buffer: ArrayBuffer): Id3Info {
  const view = new DataView(buffer);
  if (buffer.byteLength < 10) return {};
  const tag = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
  if (tag !== "ID3") return {};
  const major = view.getUint8(3);
  const size = synchsafe(view, 6);
  const end = Math.min(buffer.byteLength, 10 + size);
  let offset = 10;
  const info: Id3Info = {};
  const bytes = new Uint8Array(buffer);

  while (offset + 10 < end) {
    const id = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const frameSize =
      major >= 4 ? synchsafe(view, offset + 4) : view.getUint32(offset + 4);
    const dataStart = offset + 10;
    const dataEnd = Math.min(end, dataStart + frameSize);
    if (dataEnd <= dataStart) break;
    const payload = bytes.subarray(dataStart, dataEnd);
    if (id === "TIT2") info.title = decodeText(payload);
    else if (id === "TPE1") info.artist = decodeText(payload);
    else if (id === "TALB") info.album = decodeText(payload);
    else if (id === "APIC" && !info.picture) info.picture = parseApic(payload);
    offset = dataEnd;
  }
  return info;
}
