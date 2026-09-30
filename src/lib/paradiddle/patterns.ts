import { energyAt } from "./beat-detect";
import type { Analysis, Difficulty, DrumName, DrumNote, GrooveId } from "./types";

type Step = 0 | 1 | 2;

type BarPattern = {
  kick: Step[];
  snare: Step[];
  hat: Step[];
};

const EMPTY16: Step[] = Array.from({ length: 16 }, () => 0);

function pat(...hits: number[]): Step[] {
  const out = EMPTY16.slice() as Step[];
  for (const h of hits) out[h] = 1;
  return out;
}

const GROOVE_BARS: Record<Exclude<GrooveId, "auto">, BarPattern> = {
  rock: {
    kick: pat(0, 8),
    snare: pat(4, 12),
    hat: pat(0, 2, 4, 6, 8, 10, 12, 14),
  },
  pop: {
    kick: pat(0, 8, 10),
    snare: pat(4, 12),
    hat: pat(0, 2, 4, 6, 8, 10, 12, 14),
  },
  punk: {
    kick: pat(0, 4, 8, 12),
    snare: pat(4, 12),
    hat: pat(0, 2, 4, 6, 8, 10, 12, 14),
  },
  metal: {
    kick: pat(0, 2, 4, 6, 8, 10, 12, 14),
    snare: pat(4, 12),
    hat: pat(0, 4, 8, 12),
  },
  funk: {
    kick: pat(0, 6, 10),
    snare: pat(4, 12),
    hat: pat(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15),
  },
  disco: {
    kick: pat(0, 4, 8, 12),
    snare: pat(4, 12),
    hat: pat(0, 2, 4, 6, 8, 10, 12, 14),
  },
  hiphop: {
    kick: pat(0, 8, 11),
    snare: pat(4, 12),
    hat: pat(0, 2, 4, 6, 8, 10, 12, 14),
  },
};

function pushNote(notes: DrumNote[], name: DrumName, time: number, vel: number) {
  if (time < 0) return;
  notes.push({
    name,
    time,
    vel: Math.max(20, Math.min(127, Math.round(vel))),
    loc: 0,
  });
}

function quantize(time: number, bpm: number, offset: number, grid: number) {
  const beat = 60 / bpm;
  const step = beat / grid;
  const rel = time - offset;
  const q = Math.round(rel / step) * step + offset;
  return Math.max(0, q);
}

function densityFor(diff: Difficulty): { hats: number; extraKick: boolean; fills: boolean; crashes: boolean; sixteenths: boolean } {
  switch (diff) {
    case "Easy":
      return { hats: 0, extraKick: false, fills: false, crashes: false, sixteenths: false };
    case "Medium":
      return { hats: 4, extraKick: false, fills: false, crashes: true, sixteenths: false };
    case "Hard":
      return { hats: 8, extraKick: true, fills: false, crashes: true, sixteenths: false };
    default:
      return { hats: 16, extraKick: true, fills: true, crashes: true, sixteenths: true };
  }
}

function meanEnergy(analysis: Analysis) {
  let s = 0;
  for (let i = 0; i < analysis.energy.length; i++) s += analysis.energy[i];
  return s / Math.max(1, analysis.energy.length);
}

export function generateChart(
  analysis: Analysis,
  groove: GrooveId,
  difficulty: Difficulty,
): DrumNote[] {
  const notes: DrumNote[] = [];
  const bpm = analysis.bpm || 120;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const offset = analysis.beatOffset % beat;
  const dens = densityFor(difficulty);
  const avgE = meanEnergy(analysis);
  const duration = analysis.duration;

  if (groove === "auto") {
    const used = new Set<string>();
    const add = (name: DrumName, time: number, vel: number) => {
      const t = quantize(time, bpm, offset, dens.sixteenths ? 4 : 2);
      if (t > duration - 0.05) return;
      const key = `${name}:${t.toFixed(3)}`;
      if (used.has(key)) return;
      used.add(key);
      pushNote(notes, name, t, vel);
    };

    for (const o of analysis.onsets) {
      const e = energyAt(analysis, o.time);
      if (e < avgE * 0.28) continue;
      const vel = 50 + Math.min(70, o.strength * 4000);
      if (o.band === "low") add("BP_Kick_C_1", o.time, vel + 10);
      else if (o.band === "mid") add("BP_Snare_C_1", o.time, vel);
      else if (dens.hats) add("BP_HiHat_C_1", o.time, Math.min(110, vel - 10));
    }

    if (dens.hats) {
      const hatStep = dens.hats >= 16 ? beat / 2 : beat;
      for (let t = offset; t < duration; t += hatStep) {
        if (energyAt(analysis, t) < avgE * 0.35) continue;
        add("BP_HiHat_C_1", t, 70);
      }
    }

    if (dens.crashes) {
      for (let t = offset; t < duration; t += bar * 4) {
        if (energyAt(analysis, t) > avgE * 1.05) add("BP_Crash15_C_1", t, 110);
      }
    }
  } else {
    const g = GROOVE_BARS[groove];
    const bars = Math.ceil(duration / bar);
    for (let b = 0; b < bars; b++) {
      const barStart = offset + b * bar;
      if (barStart >= duration) break;
      const e = energyAt(analysis, barStart + beat);
      if (e < avgE * 0.22 && b > 0) continue;

      const kickHits = dens.extraKick ? g.kick : g.kick.map((v, i) => (i % 8 === 0 ? v : 0));
      const hatHits =
        dens.hats === 0
          ? EMPTY16
          : dens.hats <= 4
            ? g.hat.map((v, i) => (i % 4 === 0 ? v : 0))
            : dens.hats <= 8
              ? g.hat.map((v, i) => (i % 2 === 0 ? v : 0))
              : g.hat;

      for (let s = 0; s < 16; s++) {
        const t = barStart + s * (beat / 4);
        if (t >= duration) break;
        if (kickHits[s]) pushNote(notes, "BP_Kick_C_1", t, 100 + (s === 0 ? 12 : 0));
        if (g.snare[s]) pushNote(notes, "BP_Snare_C_1", t, 105);
        if (hatHits[s]) pushNote(notes, "BP_HiHat_C_1", t, 72 + (s % 2 === 0 ? 8 : 0));
      }

      if (dens.crashes && b % 4 === 0 && e > avgE * 0.7) {
        pushNote(notes, "BP_Crash15_C_1", barStart, 118);
      }

      if (dens.fills && (b + 1) % 8 === 0) {
        const fillStart = barStart + beat * 2;
        const toms: DrumName[] = ["BP_Tom1_C_1", "BP_Tom2_C_2", "BP_FloorTom_C_1", "BP_Snare_C_1"];
        for (let i = 0; i < 8; i++) {
          const t = fillStart + i * (beat / 4);
          if (t >= duration) break;
          pushNote(notes, toms[i % toms.length], t, 90 + i);
        }
        pushNote(notes, "BP_Crash17_C_1", barStart + bar, 120);
      }
    }
  }

  notes.sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));
  return dedupe(notes);
}

function dedupe(notes: DrumNote[]): DrumNote[] {
  const out: DrumNote[] = [];
  const last = new Map<string, number>();
  for (const n of notes) {
    const prev = last.get(n.name);
    if (prev !== undefined && n.time - prev < 0.04) continue;
    last.set(n.name, n.time);
    out.push(n);
  }
  return out;
}

export function filterMidiNotes(notes: DrumNote[], difficulty: Difficulty, duration: number): DrumNote[] {
  const dens = densityFor(difficulty);
  const grid = dens.sixteenths ? 4 : 2;
  const beat = 0.5;
  const out: DrumNote[] = [];
  const last = new Map<string, number>();
  for (const n of notes) {
    if (n.time > duration) continue;
    if (!dens.hats && n.name === "BP_HiHat_C_1") continue;
    if (!dens.fills && (n.name === "BP_Tom1_C_1" || n.name === "BP_Tom2_C_2" || n.name === "BP_FloorTom_C_1")) {
      if (difficulty === "Easy") continue;
    }
    if (difficulty === "Easy" && (n.name === "BP_Crash15_C_1" || n.name === "BP_Crash17_C_1" || n.name === "BP_Ride17_C_1")) {
      continue;
    }
    const step = beat / grid;
    const q = Math.round(n.time / step) * step;
    const prev = last.get(n.name);
    if (prev !== undefined && Math.abs(q - prev) < 0.05) continue;
    last.set(n.name, q);
    out.push({ ...n, time: q });
  }
  return out.sort((a, b) => a.time - b.time);
}
