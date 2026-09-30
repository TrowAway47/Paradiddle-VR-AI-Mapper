import type { Analysis } from "./types";

export type { Analysis };

function mixMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length;
  const out = new Float32Array(len);
  const ch = buffer.numberOfChannels;
  for (let c = 0; c < ch; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += data[i] / ch;
  }
  return out;
}

function downsample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return data;
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.floor(data.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(data.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += data[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

function onePole(data: Float32Array, cutoff: number, sampleRate: number, high = false): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const a = dt / (rc + dt);
  const out = new Float32Array(data.length);
  let y = 0;
  for (let i = 0; i < data.length; i++) {
    y += a * (data[i] - y);
    out[i] = high ? data[i] - y : y;
  }
  return out;
}

function envelope(data: Float32Array, hop: number, frame: number): Float32Array {
  const n = Math.max(1, Math.floor((data.length - frame) / hop));
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const start = i * hop;
    let e = 0;
    for (let j = 0; j < frame; j++) {
      const v = data[start + j];
      e += v * v;
    }
    env[i] = Math.sqrt(e / frame);
  }
  return env;
}

function flux(env: Float32Array): Float32Array {
  const out = new Float32Array(env.length);
  for (let i = 1; i < env.length; i++) out[i] = Math.max(0, env[i] - env[i - 1]);
  return out;
}

function mean(arr: Float32Array): number {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / Math.max(1, arr.length);
}

function pickPeaks(signal: Float32Array, hop: number, sampleRate: number, minGapSec: number) {
  const avg = mean(signal);
  let std = 0;
  for (let i = 0; i < signal.length; i++) {
    const d = signal[i] - avg;
    std += d * d;
  }
  std = Math.sqrt(std / Math.max(1, signal.length));
  const thresh = avg + std * 0.9;
  const minGap = Math.max(1, Math.round((minGapSec * sampleRate) / hop));
  const peaks: { index: number; value: number }[] = [];
  let last = -minGap;
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > thresh && signal[i] >= signal[i - 1] && signal[i] >= signal[i + 1] && i - last >= minGap) {
      peaks.push({ index: i, value: signal[i] });
      last = i;
    }
  }
  return peaks;
}

function estimateBpm(onset: Float32Array, hop: number, sampleRate: number): { bpm: number; offset: number } {
  const minBpm = 70;
  const maxBpm = 180;
  const minLag = Math.round(((60 / maxBpm) * sampleRate) / hop);
  const maxLag = Math.round(((60 / minBpm) * sampleRate) / hop);
  let bestLag = minLag;
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acc = 0;
    const n = onset.length - lag;
    for (let i = 0; i < n; i++) acc += onset[i] * onset[i + lag];
    const score = acc / Math.max(1, n);
    if (score > best) {
      best = score;
      bestLag = lag;
    }
  }
  let bpm = (60 * sampleRate) / (bestLag * hop);
  // Prefer typical song range; fold double-time if needed.
  if (bpm > 165) bpm /= 2;
  if (bpm < 75) bpm *= 2;
  bpm = Math.max(70, Math.min(180, bpm));

  const period = ((60 / bpm) * sampleRate) / hop;
  const bins = 24;
  const phase = new Float32Array(bins);
  for (let i = 0; i < onset.length; i++) {
    const p = Math.floor(((i % period) / period) * bins);
    phase[p] += onset[i];
  }
  let bestPhase = 0;
  let bestP = -1;
  for (let i = 0; i < bins; i++) {
    if (phase[i] > bestP) {
      bestP = phase[i];
      bestPhase = i;
    }
  }
  const offset = (bestPhase / bins) * (60 / bpm);
  return { bpm: Number(bpm.toFixed(2)), offset };
}

export function analyzeAudio(buffer: AudioBuffer): Analysis {
  const targetRate = 22050;
  const mono = downsample(mixMono(buffer), buffer.sampleRate, targetRate);
  const hop = 512;
  const frame = 1024;
  const low = onePole(mono, 140, targetRate, false);
  const high = onePole(mono, 4000, targetRate, true);
  const midSrc = onePole(onePole(mono, 180, targetRate, true), 2500, targetRate, false);

  const lowEnv = envelope(low, hop, frame);
  const midEnv = envelope(midSrc, hop, frame);
  const highEnv = envelope(high, hop, frame);
  const fullEnv = envelope(mono, hop, frame);

  const lowFlux = flux(lowEnv);
  const midFlux = flux(midEnv);
  const highFlux = flux(highEnv);
  const fullFlux = flux(fullEnv);

  const { bpm, offset } = estimateBpm(fullFlux, hop, targetRate);

  const lowPeaks = pickPeaks(lowFlux, hop, targetRate, 0.11);
  const midPeaks = pickPeaks(midFlux, hop, targetRate, 0.09);
  const highPeaks = pickPeaks(highFlux, hop, targetRate, 0.05);

  const toTime = (index: number) => (index * hop) / targetRate;
  const onsets: Analysis["onsets"] = [];
  for (const p of lowPeaks) onsets.push({ time: toTime(p.index), band: "low", strength: p.value });
  for (const p of midPeaks) onsets.push({ time: toTime(p.index), band: "mid", strength: p.value });
  for (const p of highPeaks) onsets.push({ time: toTime(p.index), band: "high", strength: p.value });
  onsets.sort((a, b) => a.time - b.time);

  return {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    bpm,
    beatOffset: offset,
    onsets,
    energy: fullEnv,
    energyHop: hop / targetRate,
  };
}

export function energyAt(analysis: Analysis, time: number): number {
  const i = Math.max(0, Math.min(analysis.energy.length - 1, Math.floor(time / analysis.energyHop)));
  return analysis.energy[i] ?? 0;
}
