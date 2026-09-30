import JSZip from "jszip";
import { serializeRlrr, buildRlrr } from "./rlrr";
import type { Difficulty, DrumNote, PackFile } from "./types";

export type PackBuild = {
  title: string;
  artist: string;
  creator: string;
  description: string;
  complexity: number;
  length: number;
  bpm: number;
  calibrationOffset: number;
  difficulties: Difficulty[];
  notesFor: (diff: Difficulty) => DrumNote[];
  audioBytes: Uint8Array;
  audioName: "song.ogg" | "song.wav";
  albumBytes: Uint8Array;
};

export function packFolderName(title: string): string {
  const t = title.trim() || "Untitled";
  return t;
}

export function zipDownloadName(title: string): string {
  return `${packFolderName(title)}.zip`;
}

export function previewPackFiles(
  title: string,
  difficulties: Difficulty[],
  audioBytes: number,
  albumBytes: number,
  rlrrBytes: number[],
  audioName: "song.ogg" | "song.wav" = "song.ogg",
): PackFile[] {
  const folder = packFolderName(title);
  const audioType = audioName.endsWith(".wav") ? "WAV File" : "OGG File";
  const files: PackFile[] = [
    { name: audioName.replace(/\.[^.]+$/, ""), type: audioType, bytes: audioBytes },
    { name: "album", type: "PNG File", bytes: albumBytes },
  ];
  difficulties.forEach((d, i) => {
    files.push({
      name: `${folder}_${d}.rlrr`,
      type: "RLRR File",
      bytes: rlrrBytes[i] ?? 0,
    });
  });
  return files;
}

export async function buildParadiddleZip(input: PackBuild): Promise<{ blob: Blob; files: PackFile[] }> {
  const zip = new JSZip();
  const folder = zip.folder(packFolderName(input.title));
  if (!folder) throw new Error("Could not create song folder");

  folder.file(input.audioName, input.audioBytes);
  folder.file("album.png", input.albumBytes);

  const rlrrSizes: number[] = [];
  for (const diff of input.difficulties) {
    const json = serializeRlrr(
      buildRlrr({
        title: input.title,
        artist: input.artist,
        creator: input.creator,
        description: input.description,
        complexity: input.complexity,
        length: input.length,
        bpm: input.bpm,
        calibrationOffset: input.calibrationOffset,
        notes: input.notesFor(diff),
        difficulty: diff,
      }),
    );
    const bytes = new TextEncoder().encode(json);
    rlrrSizes.push(bytes.byteLength);
    folder.file(`${packFolderName(input.title)}_${diff}.rlrr`, json);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    blob,
    files: previewPackFiles(
      input.title,
      input.difficulties,
      input.audioBytes.byteLength,
      input.albumBytes.byteLength,
      rlrrSizes,
      input.audioName,
    ),
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
