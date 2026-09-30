function kick(ctx: OfflineAudioContext, time: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
  gain.gain.setValueAtTime(0.95, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.3);
}

function snare(ctx: OfflineAudioContext, time: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
  src.connect(bp);
  bp.connect(gain);
  gain.connect(ctx.destination);
  src.start(time);
  src.stop(time + 0.18);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.frequency.value = 180;
  og.gain.setValueAtTime(0.25, time);
  og.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
  osc.connect(og);
  og.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.12);
}

function hat(ctx: OfflineAudioContext, time: number, open = false) {
  const dur = open ? 0.18 : 0.05;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(open ? 0.22 : 0.16, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  src.connect(hp);
  hp.connect(gain);
  gain.connect(ctx.destination);
  src.start(time);
  src.stop(time + dur);
}

export async function renderDemoGroove(): Promise<AudioBuffer> {
  const bpm = 120;
  const beat = 60 / bpm;
  const bars = 8;
  const duration = bars * 4 * beat + 0.4;
  const ctx = new OfflineAudioContext(2, Math.ceil(44100 * duration), 44100);

  for (let bar = 0; bar < bars; bar++) {
    const start = bar * 4 * beat;
    for (let b = 0; b < 4; b++) {
      const t = start + b * beat;
      if (b === 0 || b === 2) kick(ctx, t);
      if (b === 1 || b === 3) snare(ctx, t);
      hat(ctx, t, false);
      hat(ctx, t + beat / 2, b === 3);
    }
    if ((bar + 1) % 4 === 0) {
      kick(ctx, start + 3.5 * beat);
    }
  }

  return ctx.startRendering();
}

export function audioBufferToWavFile(buffer: AudioBuffer, name: string): File {
  const channels = Math.min(2, buffer.numberOfChannels);
  const rate = buffer.sampleRate;
  const samples = buffer.length;
  const dataSize = samples * channels * 2;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  const chans: Float32Array[] = [];
  for (let c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new File([out], name, { type: "audio/wav" });
}
