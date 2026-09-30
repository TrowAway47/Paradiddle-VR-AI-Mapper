import { create } from "zustand";
import { analyzeAudio, type Analysis } from "./beat-detect";
import { generateCover, rasterizeCover } from "./album-art";
import { parseId3 } from "./id3";
import { importMidi } from "./midi-import";
import { filterMidiNotes, generateChart } from "./patterns";
import { stripExtension } from "@/lib/utils";
import type { Difficulty, DrumNote, GrooveId } from "./types";
import { DIFFICULTIES } from "./types";

export type Stage = "idle" | "loading" | "ready" | "packing";

export type MapperState = {
  stage: Stage;
  error: string | null;
  fileName: string | null;
  audioBuffer: AudioBuffer | null;
  analysis: Analysis | null;
  title: string;
  artist: string;
  creator: string;
  description: string;
  complexity: number;
  bpm: number;
  groove: GrooveId;
  difficulties: Difficulty[];
  calibrationOffset: number;
  coverUrl: string | null;
  coverBlob: Blob | null;
  midiNotes: DrumNote[] | null;
  midiName: string | null;
  notesCache: Record<Difficulty, DrumNote[]>;
  loadFile: (file: File) => Promise<void>;
  loadBuffer: (buffer: AudioBuffer, fileName: string, title?: string) => Promise<void>;
  loadMidi: (file: File) => Promise<void>;
  setCover: (file: File) => Promise<void>;
  setField: (patch: Partial<Pick<MapperState, "title" | "artist" | "creator" | "description" | "complexity" | "bpm" | "groove" | "calibrationOffset">>) => void;
  toggleDifficulty: (d: Difficulty) => void;
  reset: () => void;
  rebuildNotes: () => void;
};

const savedCreator = () => {
  try {
    return localStorage.getItem("parapack.creator") || "";
  } catch {
    return "";
  }
};

function emptyNotes(): Record<Difficulty, DrumNote[]> {
  return { Easy: [], Medium: [], Hard: [], Expert: [] };
}

let coverObjectUrl: string | null = null;

function setCoverUrl(blob: Blob | null): string | null {
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = null;
  }
  if (!blob) return null;
  coverObjectUrl = URL.createObjectURL(blob);
  return coverObjectUrl;
}

async function decodeAudio(file: File): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const copy = await file.arrayBuffer();
    return await ctx.decodeAudioData(copy);
  } finally {
    void ctx.close();
  }
}

export const useMapper = create<MapperState>((set, get) => ({
  stage: "idle",
  error: null,
  fileName: null,
  audioBuffer: null,
  analysis: null,
  title: "",
  artist: "",
  creator: savedCreator(),
  description: "Mapped with ParaPack",
  complexity: 3,
  bpm: 120,
  groove: "auto",
  difficulties: ["Expert"],
  calibrationOffset: 0,
  coverUrl: null,
  coverBlob: null,
  midiNotes: null,
  midiName: null,
  notesCache: emptyNotes(),

  async loadFile(file) {
    set({ stage: "loading", error: null, fileName: file.name });
    try {
      const raw = await file.arrayBuffer();
      const id3 = parseId3(raw);
      const buffer = await decodeAudio(file);
      const title = id3.title || stripExtension(file.name);
      let coverBlob: Blob | null = null;
      if (id3.picture) {
        const bytes = new Uint8Array(id3.picture.data);
        const pic = new Blob([bytes], { type: id3.picture.mime });
        coverBlob = await rasterizeCover(pic);
      }
      await get().loadBuffer(buffer, file.name, title);
      const artist = id3.artist || get().artist;
      if (!coverBlob) {
        coverBlob = await generateCover(get().title, artist);
      }
      set({
        artist,
        coverBlob,
        coverUrl: setCoverUrl(coverBlob),
      });
    } catch (err) {
      set({
        stage: "idle",
        error: err instanceof Error ? err.message : "Could not read that audio file.",
      });
    }
  },

  async loadBuffer(buffer, fileName, title) {
    const analysis = analyzeAudio(buffer);
    const nextTitle = title || stripExtension(fileName);
    set({
      audioBuffer: buffer,
      analysis,
      fileName,
      title: nextTitle,
      bpm: analysis.bpm,
      midiNotes: null,
      midiName: null,
      stage: "ready",
      error: null,
    });
    if (!get().coverBlob) {
      const coverBlob = await generateCover(nextTitle, get().artist);
      set({ coverBlob, coverUrl: setCoverUrl(coverBlob) });
    }
    get().rebuildNotes();
  },

  async loadMidi(file) {
    try {
      const chart = await importMidi(file);
      set({ midiNotes: chart.notes, midiName: file.name, bpm: chart.bpm, groove: "auto" });
      get().rebuildNotes();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Could not read that MIDI file." });
    }
  },

  async setCover(file) {
    try {
      const coverBlob = await rasterizeCover(file);
      set({ coverBlob, coverUrl: setCoverUrl(coverBlob) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Could not read that image." });
    }
  },

  setField(patch) {
    if (patch.creator !== undefined) {
      try {
        localStorage.setItem("parapack.creator", patch.creator);
      } catch {
        /* ignore */
      }
    }
    set(patch);
    if (patch.bpm !== undefined || patch.groove !== undefined) get().rebuildNotes();
  },

  toggleDifficulty(d) {
    const current = get().difficulties;
    const next = current.includes(d)
      ? current.filter((x) => x !== d)
      : [...current, d];
    const ordered = DIFFICULTIES.filter((x) => next.includes(x));
    set({ difficulties: ordered.length ? ordered : ["Expert"] });
  },

  reset() {
    setCoverUrl(null);
    set({
      stage: "idle",
      error: null,
      fileName: null,
      audioBuffer: null,
      analysis: null,
      title: "",
      artist: "",
      bpm: 120,
      groove: "auto",
      coverUrl: null,
      coverBlob: null,
      midiNotes: null,
      midiName: null,
      notesCache: emptyNotes(),
    });
  },

  rebuildNotes() {
    const { analysis, groove, midiNotes, bpm } = get();
    if (!analysis) return;
    const analysisWithBpm = { ...analysis, bpm };
    const cache = emptyNotes();
    for (const d of DIFFICULTIES) {
      cache[d] = midiNotes
        ? filterMidiNotes(midiNotes, d, analysis.duration)
        : generateChart(analysisWithBpm, groove, d);
    }
    set({ notesCache: cache });
  },
}));
