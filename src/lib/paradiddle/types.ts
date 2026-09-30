export const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const GROOVES = [
  { id: "auto", label: "Auto map", hint: "Onsets from the mix" },
  { id: "rock", label: "Rock", hint: "Kick 1/3, snare 2/4" },
  { id: "pop", label: "Pop", hint: "Four-on-floor hybrid" },
  { id: "punk", label: "Punk", hint: "Driving quarters" },
  { id: "metal", label: "Metal", hint: "Double kick 8ths" },
  { id: "funk", label: "Funk", hint: "Syncopated kick" },
  { id: "disco", label: "Disco", hint: "Four on the floor" },
  { id: "hiphop", label: "Hip-hop", hint: "Backbeat pocket" },
] as const;
export type GrooveId = (typeof GROOVES)[number]["id"];

export const DRUM_LANES = [
  { id: "kick", name: "BP_Kick_C_1", label: "Kick", token: "kick" },
  { id: "snare", name: "BP_Snare_C_1", label: "Snare", token: "snare" },
  { id: "hat", name: "BP_HiHat_C_1", label: "Hi-hat", token: "hat" },
  { id: "crash", name: "BP_Crash15_C_1", label: "Crash", token: "crash" },
  { id: "crash17", name: "BP_Crash17_C_1", label: "Crash 17", token: "crash" },
  { id: "ride", name: "BP_Ride17_C_1", label: "Ride", token: "ride" },
  { id: "tom1", name: "BP_Tom1_C_1", label: "Tom 1", token: "tom" },
  { id: "tom2", name: "BP_Tom2_C_2", label: "Tom 2", token: "tom" },
  { id: "floor", name: "BP_FloorTom_C_1", label: "Floor", token: "tom" },
] as const;

export type DrumName = (typeof DRUM_LANES)[number]["name"];

export type DrumNote = {
  name: DrumName;
  time: number;
  vel: number;
  loc: number;
};

export type InstrumentDef = {
  name: string;
  class: string;
  location: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export type RlrrFile = {
  version: number;
  authoringTool: string;
  recordingMetadata: {
    title: string;
    description: string;
    coverImagePath: string;
    artist: string;
    author: string;
    creator: string;
    length: number;
    complexity: number;
  };
  audioFileData: {
    songTracks: string[];
    drumTracks: string[];
    songPreview: string;
    calibrationOffset: number;
  };
  instruments: InstrumentDef[];
  events: Array<{
    name: string;
    vel: number;
    loc: number;
    time: string;
  }>;
  bpmEvents: Array<{ bpm: number; time: number }>;
};

export type PackFile = {
  name: string;
  type: string;
  bytes: number;
};

export type Analysis = {
  duration: number;
  sampleRate: number;
  bpm: number;
  beatOffset: number;
  onsets: { time: number; band: "low" | "mid" | "high"; strength: number }[];
  energy: Float32Array;
  energyHop: number;
};
