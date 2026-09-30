import { DEFAULT_KIT } from "./default-kit";
import type { Difficulty, DrumNote, RlrrFile } from "./types";

export type RlrrInput = {
  title: string;
  artist: string;
  creator: string;
  description: string;
  complexity: number;
  length: number;
  bpm: number;
  calibrationOffset: number;
  notes: DrumNote[];
  difficulty: Difficulty;
};

export function buildRlrr(input: RlrrInput): RlrrFile {
  const events = input.notes
    .slice()
    .sort((a, b) => a.time - b.time)
    .map((n) => ({
      name: n.name,
      vel: Math.max(1, Math.min(127, Math.round(n.vel))),
      loc: n.loc,
      time: n.time.toFixed(4),
    }));

  return {
    version: 0.7,
    authoringTool: "ParaPack Mapper",
    recordingMetadata: {
      title: input.title,
      description: input.description,
      coverImagePath: "album.png",
      artist: input.artist,
      author: input.creator,
      creator: input.creator,
      length: Number(input.length.toFixed(3)),
      complexity: Math.max(1, Math.min(5, Math.round(input.complexity))),
    },
    audioFileData: {
      songTracks: ["song.ogg"],
      drumTracks: [],
      songPreview: "",
      calibrationOffset: Math.round(input.calibrationOffset),
    },
    instruments: DEFAULT_KIT,
    events,
    bpmEvents: [{ bpm: Number(input.bpm.toFixed(3)), time: 0 }],
  };
}

export function serializeRlrr(file: RlrrFile): string {
  return JSON.stringify(file, null, 4);
}
