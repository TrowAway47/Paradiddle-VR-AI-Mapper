import type { DrumName, DrumNote } from "./types";

const GM_TO_DRUM: Record<number, DrumName> = {
  35: "BP_Kick_C_1",
  36: "BP_Kick_C_1",
  37: "BP_Snare_C_1",
  38: "BP_Snare_C_1",
  40: "BP_Snare_C_1",
  41: "BP_FloorTom_C_1",
  43: "BP_FloorTom_C_1",
  42: "BP_HiHat_C_1",
  44: "BP_HiHat_C_1",
  46: "BP_HiHat_C_1",
  45: "BP_Tom2_C_2",
  47: "BP_Tom2_C_2",
  48: "BP_Tom1_C_1",
  50: "BP_Tom1_C_1",
  49: "BP_Crash15_C_1",
  55: "BP_Crash15_C_1",
  57: "BP_Crash17_C_1",
  51: "BP_Ride17_C_1",
  53: "BP_Ride17_C_1",
  59: "BP_Ride17_C_1",
};

export type MidiChart = {
  notes: DrumNote[];
  bpm: number;
};

function readStr(view: DataView, offset: number, n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

function vlq(bytes: Uint8Array, i: number): { value: number; next: number } {
  let value = 0;
  let next = i;
  while (next < bytes.length) {
    const b = bytes[next++];
    value = (value << 7) | (b & 0x7f);
    if ((b & 0x80) === 0) break;
  }
  return { value, next };
}

export async function importMidi(file: File): Promise<MidiChart> {
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  if (buf.byteLength < 14 || readStr(view, 0, 4) !== "MThd") {
    throw new Error("Not a valid MIDI file.");
  }
  const headerLen = view.getUint32(4);
  const ticksPerBeat = view.getUint16(12);
  const notes: DrumNote[] = [];
  let bpm = 120;
  let offset = 8 + headerLen;

  while (offset + 8 < bytes.length) {
    const id = readStr(view, offset, 4);
    const length = view.getUint32(offset + 4);
    const start = offset + 8;
    const end = Math.min(bytes.length, start + length);
    if (id !== "MTrk") {
      offset = end;
      continue;
    }
    let i = start;
    let ticks = 0;
    let tempo = 500000;
    let running = 0;
    const tempoChanges: { tick: number; tempo: number }[] = [{ tick: 0, tempo }];

    const ticksToSec = (t: number) => {
      let sec = 0;
      let lastTick = 0;
      let cur = 500000;
      for (const c of tempoChanges) {
        if (c.tick >= t) break;
        sec += ((c.tick - lastTick) * cur) / ticksPerBeat / 1_000_000;
        lastTick = c.tick;
        cur = c.tempo;
      }
      sec += ((t - lastTick) * cur) / ticksPerBeat / 1_000_000;
      return sec;
    };

    while (i < end) {
      const delta = vlq(bytes, i);
      i = delta.next;
      ticks += delta.value;
      if (i >= end) break;
      let status = bytes[i];
      if (status < 0x80) {
        status = running;
      } else {
        i++;
        running = status;
      }
      if (status === 0xff) {
        const type = bytes[i++];
        const len = vlq(bytes, i);
        i = len.next;
        if (type === 0x51 && len.value >= 3) {
          tempo = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
          tempoChanges.push({ tick: ticks, tempo });
          bpm = 60_000_000 / tempo;
        }
        i += len.value;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const len = vlq(bytes, i);
        i = len.next + len.value;
        continue;
      }
      const cmd = status & 0xf0;
      if (cmd === 0x90 || cmd === 0x80) {
        const note = bytes[i++];
        const vel = bytes[i++];
        if (cmd === 0x90 && vel > 0) {
          const name = GM_TO_DRUM[note];
          if (name) {
            notes.push({
              name,
              time: ticksToSec(ticks),
              vel,
              loc: 0,
            });
          }
        }
      } else if (cmd === 0xc0 || cmd === 0xd0) {
        i += 1;
      } else {
        i += 2;
      }
    }
    offset = end;
  }

  notes.sort((a, b) => a.time - b.time);
  return { notes, bpm: Number(bpm.toFixed(2)) };
}
