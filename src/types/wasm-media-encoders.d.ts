declare module "wasm-media-encoders" {
  export class WasmMediaEncoder<MimeType extends "audio/mpeg" | "audio/ogg"> {
    readonly mimeType: MimeType;
    configure(params: {
      channels: 1 | 2;
      sampleRate: number;
      vbrQuality?: number;
      bitrate?: number;
    }): void;
    encode(samples: readonly Float32Array[]): Uint8Array;
    finalize(): Uint8Array;
  }

  export function createEncoder<T extends "audio/mpeg" | "audio/ogg">(
    mimeType: T,
    wasm: string | ArrayBuffer | Uint8Array | WebAssembly.Module,
  ): Promise<WasmMediaEncoder<T>>;

  export function createOggEncoder(): Promise<WasmMediaEncoder<"audio/ogg">>;
  export function createMp3Encoder(): Promise<WasmMediaEncoder<"audio/mpeg">>;
}
