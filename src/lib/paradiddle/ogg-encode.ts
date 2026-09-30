import { createEncoder, type WasmMediaEncoder } from "wasm-media-encoders";

let encoderPromise: Promise<WasmMediaEncoder<"audio/ogg">> | null = null;

async function getEncoder() {
  if (!encoderPromise) {
    encoderPromise = createEncoder("audio/ogg", "/encoders/ogg.wasm");
  }
  return encoderPromise;
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export async function encodeOggVorbis(
  buffer: AudioBuffer,
  onProgress?: (ratio: number) => void,
): Promise<Uint8Array> {
  const encoder = await getEncoder();
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels)) as 1 | 2;
  encoder.configure({
    sampleRate: buffer.sampleRate,
    channels,
    vbrQuality: 4,
  });

  const left = buffer.getChannelData(0);
  const right = channels === 2 ? buffer.getChannelData(1) : left;
  const frame = 4096;
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (let i = 0; i < left.length; i += frame) {
    const end = Math.min(left.length, i + frame);
    const samples =
      channels === 2
        ? [left.subarray(i, end), right.subarray(i, end)]
        : [left.subarray(i, end)];
    const encoded = encoder.encode(samples);
    if (encoded.length) {
      const copy = encoded.slice();
      chunks.push(copy);
      total += copy.length;
    }
    if (i % (frame * 12) === 0) {
      onProgress?.(end / left.length * 0.96);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  const tail = encoder.finalize();
  if (tail.length) {
    const copy = tail.slice();
    chunks.push(copy);
    total += copy.length;
  }
  onProgress?.(1);
  return concat(chunks, total);
}

/** PCM WAV fallback if Vorbis WASM cannot load. Paradiddle accepts WAV. */
export function encodeWav(buffer: AudioBuffer): Uint8Array {
  const channels = Math.min(2, buffer.numberOfChannels);
  const rate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Uint8Array(out);
}
