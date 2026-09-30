import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Pause, c as FileAudio, i as Play, l as Drum, o as ImagePlus, r as RotateCcw, s as Folder, t as Upload, u as Download } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as I } from "../_libs/wasm-media-encoders.mjs";
import { t as require_lib } from "../_libs/jszip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B-3W2Z-Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_lib = /* @__PURE__ */ __toESM(require_lib());
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${Math.round(kb).toLocaleString()} KB`;
	return `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatClock(seconds) {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
function stripExtension(name) {
	return name.replace(/\.[^/.]+$/, "");
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-opacity transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90 active:scale-[0.98]",
			secondary: "border border-border bg-surface-2 text-fg hover:border-border-strong hover:bg-surface-3",
			ghost: "text-muted hover:bg-surface-2 hover:text-fg",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			default: "h-11 px-4 text-sm",
			sm: "h-9 px-3 text-sm",
			lg: "h-12 px-5 text-base",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
function mixMono(buffer) {
	const len = buffer.length;
	const out = new Float32Array(len);
	const ch = buffer.numberOfChannels;
	for (let c = 0; c < ch; c++) {
		const data = buffer.getChannelData(c);
		for (let i = 0; i < len; i++) out[i] += data[i] / ch;
	}
	return out;
}
function downsample(data, fromRate, toRate) {
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
function onePole(data, cutoff, sampleRate, high = false) {
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
function envelope(data, hop, frame) {
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
function flux(env) {
	const out = new Float32Array(env.length);
	for (let i = 1; i < env.length; i++) out[i] = Math.max(0, env[i] - env[i - 1]);
	return out;
}
function mean(arr) {
	let s = 0;
	for (let i = 0; i < arr.length; i++) s += arr[i];
	return s / Math.max(1, arr.length);
}
function pickPeaks(signal, hop, sampleRate, minGapSec) {
	const avg = mean(signal);
	let std = 0;
	for (let i = 0; i < signal.length; i++) {
		const d = signal[i] - avg;
		std += d * d;
	}
	std = Math.sqrt(std / Math.max(1, signal.length));
	const thresh = avg + std * .9;
	const minGap = Math.max(1, Math.round(minGapSec * sampleRate / hop));
	const peaks = [];
	let last = -minGap;
	for (let i = 1; i < signal.length - 1; i++) if (signal[i] > thresh && signal[i] >= signal[i - 1] && signal[i] >= signal[i + 1] && i - last >= minGap) {
		peaks.push({
			index: i,
			value: signal[i]
		});
		last = i;
	}
	return peaks;
}
function estimateBpm(onset, hop, sampleRate) {
	const minBpm = 70;
	const minLag = Math.round(60 / 180 * sampleRate / hop);
	const maxLag = Math.round(60 / minBpm * sampleRate / hop);
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
	let bpm = 60 * sampleRate / (bestLag * hop);
	if (bpm > 165) bpm /= 2;
	if (bpm < 75) bpm *= 2;
	bpm = Math.max(70, Math.min(180, bpm));
	const period = 60 / bpm * sampleRate / hop;
	const bins = 24;
	const phase = new Float32Array(bins);
	for (let i = 0; i < onset.length; i++) {
		const p = Math.floor(i % period / period * bins);
		phase[p] += onset[i];
	}
	let bestPhase = 0;
	let bestP = -1;
	for (let i = 0; i < bins; i++) if (phase[i] > bestP) {
		bestP = phase[i];
		bestPhase = i;
	}
	const offset = bestPhase / bins * (60 / bpm);
	return {
		bpm: Number(bpm.toFixed(2)),
		offset
	};
}
function analyzeAudio(buffer) {
	const targetRate = 22050;
	const mono = downsample(mixMono(buffer), buffer.sampleRate, targetRate);
	const hop = 512;
	const frame = 1024;
	const low = onePole(mono, 140, targetRate, false);
	const high = onePole(mono, 4e3, targetRate, true);
	const midSrc = onePole(onePole(mono, 180, targetRate, true), 2500, targetRate, false);
	const lowEnv = envelope(low, hop, frame);
	const midEnv = envelope(midSrc, hop, frame);
	const highEnv = envelope(high, hop, frame);
	const fullEnv = envelope(mono, hop, frame);
	const lowFlux = flux(lowEnv);
	const midFlux = flux(midEnv);
	const highFlux = flux(highEnv);
	const { bpm, offset } = estimateBpm(flux(fullEnv), hop, targetRate);
	const lowPeaks = pickPeaks(lowFlux, hop, targetRate, .11);
	const midPeaks = pickPeaks(midFlux, hop, targetRate, .09);
	const highPeaks = pickPeaks(highFlux, hop, targetRate, .05);
	const toTime = (index) => index * hop / targetRate;
	const onsets = [];
	for (const p of lowPeaks) onsets.push({
		time: toTime(p.index),
		band: "low",
		strength: p.value
	});
	for (const p of midPeaks) onsets.push({
		time: toTime(p.index),
		band: "mid",
		strength: p.value
	});
	for (const p of highPeaks) onsets.push({
		time: toTime(p.index),
		band: "high",
		strength: p.value
	});
	onsets.sort((a, b) => a.time - b.time);
	return {
		duration: buffer.duration,
		sampleRate: buffer.sampleRate,
		bpm,
		beatOffset: offset,
		onsets,
		energy: fullEnv,
		energyHop: hop / targetRate
	};
}
function energyAt(analysis, time) {
	const i = Math.max(0, Math.min(analysis.energy.length - 1, Math.floor(time / analysis.energyHop)));
	return analysis.energy[i] ?? 0;
}
async function rasterizeCover(file, size = 512) {
	const url = URL.createObjectURL(file);
	try {
		const img = await loadImage(url);
		const canvas = document.createElement("canvas");
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas unavailable");
		const min = Math.min(img.width, img.height);
		const sx = (img.width - min) / 2;
		const sy = (img.height - min) / 2;
		ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
		return await canvasToPng(canvas);
	} finally {
		URL.revokeObjectURL(url);
	}
}
async function generateCover(title, artist, size = 512) {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas unavailable");
	ctx.fillStyle = "#08090b";
	ctx.fillRect(0, 0, size, size);
	const cx = size / 2;
	const cy = size / 2 - 12;
	ctx.strokeStyle = "#c9d0db";
	ctx.lineWidth = 8;
	ctx.beginPath();
	ctx.arc(cx, cy, size * .32, 0, Math.PI * 2);
	ctx.stroke();
	ctx.strokeStyle = "#3c4250";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(cx, cy, size * .22, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = "#c9d0db";
	ctx.beginPath();
	ctx.arc(cx, cy, 10, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#8b909c";
	ctx.font = "500 14px 'IBM Plex Sans', sans-serif";
	ctx.textAlign = "center";
	ctx.fillText("PARAPACK  ·  PARADIDDLE VR", cx, size - 36);
	ctx.fillStyle = "#eceef2";
	ctx.font = "400 42px 'Bebas Neue', sans-serif";
	const titleLine = fitText(ctx, title || "Untitled", size - 64);
	ctx.fillText(titleLine, cx, size - 78);
	if (artist) {
		ctx.fillStyle = "#8b909c";
		ctx.font = "500 16px 'IBM Plex Sans', sans-serif";
		ctx.fillText(fitText(ctx, artist, size - 80), cx, size - 52);
	}
	return canvasToPng(canvas);
}
function fitText(ctx, text, max) {
	if (ctx.measureText(text).width <= max) return text;
	let t = text;
	while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
	return `${t}…`;
}
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("Could not read image"));
		img.src = url;
	});
}
function canvasToPng(canvas) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(/* @__PURE__ */ new Error("PNG encode failed"));
		}, "image/png");
	});
}
async function blobToUint8(blob) {
	return new Uint8Array(await blob.arrayBuffer());
}
function synchsafe(view, offset) {
	return (view.getUint8(offset) & 127) << 21 | (view.getUint8(offset + 1) & 127) << 14 | (view.getUint8(offset + 2) & 127) << 7 | view.getUint8(offset + 3) & 127;
}
function decodeText(bytes) {
	if (bytes.length === 0) return "";
	const enc = bytes[0];
	const body = bytes.subarray(1);
	try {
		if (enc === 1) return new TextDecoder("utf-16").decode(body).replace(/\0/g, "").trim();
		if (enc === 2) return new TextDecoder("utf-16be").decode(body).replace(/\0/g, "").trim();
		if (enc === 3) return new TextDecoder("utf-8").decode(body).replace(/\0/g, "").trim();
		return new TextDecoder("latin1").decode(body).replace(/\0/g, "").trim();
	} catch {
		return new TextDecoder("latin1").decode(body).replace(/\0/g, "").trim();
	}
}
function cstr(bytes, start, encoding = 0) {
	if (encoding === 1 || encoding === 2) {
		for (let i = start; i + 1 < bytes.length; i += 2) if (bytes[i] === 0 && bytes[i + 1] === 0) {
			const slice = bytes.subarray(start, i);
			return {
				text: (encoding === 1 ? new TextDecoder("utf-16").decode(slice) : new TextDecoder("utf-16be").decode(slice)).replace(/\0/g, ""),
				next: i + 2
			};
		}
	} else {
		let i = start;
		while (i < bytes.length && bytes[i] !== 0) i++;
		return {
			text: new TextDecoder(encoding === 3 ? "utf-8" : "latin1").decode(bytes.subarray(start, i)),
			next: Math.min(bytes.length, i + 1)
		};
	}
	return {
		text: "",
		next: bytes.length
	};
}
function parseApic(bytes) {
	if (bytes.length < 4) return;
	const encoding = bytes[0] ?? 0;
	const mime = cstr(bytes, 1, 0);
	const typeOffset = mime.next;
	if (typeOffset >= bytes.length) return;
	const desc = cstr(bytes, typeOffset + 1, encoding);
	const data = bytes.subarray(desc.next);
	if (data.length < 16) return;
	return {
		mime: mime.text || "image/jpeg",
		data
	};
}
function parseId3(buffer) {
	const view = new DataView(buffer);
	if (buffer.byteLength < 10) return {};
	if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2)) !== "ID3") return {};
	const major = view.getUint8(3);
	const size = synchsafe(view, 6);
	const end = Math.min(buffer.byteLength, 10 + size);
	let offset = 10;
	const info = {};
	const bytes = new Uint8Array(buffer);
	while (offset + 10 < end) {
		const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
		if (!/^[A-Z0-9]{4}$/.test(id)) break;
		const frameSize = major >= 4 ? synchsafe(view, offset + 4) : view.getUint32(offset + 4);
		const dataStart = offset + 10;
		const dataEnd = Math.min(end, dataStart + frameSize);
		if (dataEnd <= dataStart) break;
		const payload = bytes.subarray(dataStart, dataEnd);
		if (id === "TIT2") info.title = decodeText(payload);
		else if (id === "TPE1") info.artist = decodeText(payload);
		else if (id === "TALB") info.album = decodeText(payload);
		else if (id === "APIC" && !info.picture) info.picture = parseApic(payload);
		offset = dataEnd;
	}
	return info;
}
var GM_TO_DRUM = {
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
	59: "BP_Ride17_C_1"
};
function readStr(view, offset, n) {
	let s = "";
	for (let i = 0; i < n; i++) s += String.fromCharCode(view.getUint8(offset + i));
	return s;
}
function vlq(bytes, i) {
	let value = 0;
	let next = i;
	while (next < bytes.length) {
		const b = bytes[next++];
		value = value << 7 | b & 127;
		if ((b & 128) === 0) break;
	}
	return {
		value,
		next
	};
}
async function importMidi(file) {
	const buf = await file.arrayBuffer();
	const view = new DataView(buf);
	const bytes = new Uint8Array(buf);
	if (buf.byteLength < 14 || readStr(view, 0, 4) !== "MThd") throw new Error("Not a valid MIDI file.");
	const headerLen = view.getUint32(4);
	const ticksPerBeat = view.getUint16(12);
	const notes = [];
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
		let tempo = 5e5;
		let running = 0;
		const tempoChanges = [{
			tick: 0,
			tempo
		}];
		const ticksToSec = (t) => {
			let sec = 0;
			let lastTick = 0;
			let cur = 5e5;
			for (const c of tempoChanges) {
				if (c.tick >= t) break;
				sec += (c.tick - lastTick) * cur / ticksPerBeat / 1e6;
				lastTick = c.tick;
				cur = c.tempo;
			}
			sec += (t - lastTick) * cur / ticksPerBeat / 1e6;
			return sec;
		};
		while (i < end) {
			const delta = vlq(bytes, i);
			i = delta.next;
			ticks += delta.value;
			if (i >= end) break;
			let status = bytes[i];
			if (status < 128) status = running;
			else {
				i++;
				running = status;
			}
			if (status === 255) {
				const type = bytes[i++];
				const len = vlq(bytes, i);
				i = len.next;
				if (type === 81 && len.value >= 3) {
					tempo = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
					tempoChanges.push({
						tick: ticks,
						tempo
					});
					bpm = 6e7 / tempo;
				}
				i += len.value;
				continue;
			}
			if (status === 240 || status === 247) {
				const len = vlq(bytes, i);
				i = len.next + len.value;
				continue;
			}
			const cmd = status & 240;
			if (cmd === 144 || cmd === 128) {
				const note = bytes[i++];
				const vel = bytes[i++];
				if (cmd === 144 && vel > 0) {
					const name = GM_TO_DRUM[note];
					if (name) notes.push({
						name,
						time: ticksToSec(ticks),
						vel,
						loc: 0
					});
				}
			} else if (cmd === 192 || cmd === 208) i += 1;
			else i += 2;
		}
		offset = end;
	}
	notes.sort((a, b) => a.time - b.time);
	return {
		notes,
		bpm: Number(bpm.toFixed(2))
	};
}
var EMPTY16 = Array.from({ length: 16 }, () => 0);
function pat(...hits) {
	const out = EMPTY16.slice();
	for (const h of hits) out[h] = 1;
	return out;
}
var GROOVE_BARS = {
	rock: {
		kick: pat(0, 8),
		snare: pat(4, 12),
		hat: pat(0, 2, 4, 6, 8, 10, 12, 14)
	},
	pop: {
		kick: pat(0, 8, 10),
		snare: pat(4, 12),
		hat: pat(0, 2, 4, 6, 8, 10, 12, 14)
	},
	punk: {
		kick: pat(0, 4, 8, 12),
		snare: pat(4, 12),
		hat: pat(0, 2, 4, 6, 8, 10, 12, 14)
	},
	metal: {
		kick: pat(0, 2, 4, 6, 8, 10, 12, 14),
		snare: pat(4, 12),
		hat: pat(0, 4, 8, 12)
	},
	funk: {
		kick: pat(0, 6, 10),
		snare: pat(4, 12),
		hat: pat(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)
	},
	disco: {
		kick: pat(0, 4, 8, 12),
		snare: pat(4, 12),
		hat: pat(0, 2, 4, 6, 8, 10, 12, 14)
	},
	hiphop: {
		kick: pat(0, 8, 11),
		snare: pat(4, 12),
		hat: pat(0, 2, 4, 6, 8, 10, 12, 14)
	}
};
function pushNote(notes, name, time, vel) {
	if (time < 0) return;
	notes.push({
		name,
		time,
		vel: Math.max(20, Math.min(127, Math.round(vel))),
		loc: 0
	});
}
function quantize(time, bpm, offset, grid) {
	const step = 60 / bpm / grid;
	const rel = time - offset;
	const q = Math.round(rel / step) * step + offset;
	return Math.max(0, q);
}
function densityFor(diff) {
	switch (diff) {
		case "Easy": return {
			hats: 0,
			extraKick: false,
			fills: false,
			crashes: false,
			sixteenths: false
		};
		case "Medium": return {
			hats: 4,
			extraKick: false,
			fills: false,
			crashes: true,
			sixteenths: false
		};
		case "Hard": return {
			hats: 8,
			extraKick: true,
			fills: false,
			crashes: true,
			sixteenths: false
		};
		default: return {
			hats: 16,
			extraKick: true,
			fills: true,
			crashes: true,
			sixteenths: true
		};
	}
}
function meanEnergy(analysis) {
	let s = 0;
	for (let i = 0; i < analysis.energy.length; i++) s += analysis.energy[i];
	return s / Math.max(1, analysis.energy.length);
}
function generateChart(analysis, groove, difficulty) {
	const notes = [];
	const bpm = analysis.bpm || 120;
	const beat = 60 / bpm;
	const bar = beat * 4;
	const offset = analysis.beatOffset % beat;
	const dens = densityFor(difficulty);
	const avgE = meanEnergy(analysis);
	const duration = analysis.duration;
	if (groove === "auto") {
		const used = /* @__PURE__ */ new Set();
		const add = (name, time, vel) => {
			const t = quantize(time, bpm, offset, dens.sixteenths ? 4 : 2);
			if (t > duration - .05) return;
			const key = `${name}:${t.toFixed(3)}`;
			if (used.has(key)) return;
			used.add(key);
			pushNote(notes, name, t, vel);
		};
		for (const o of analysis.onsets) {
			if (energyAt(analysis, o.time) < avgE * .28) continue;
			const vel = 50 + Math.min(70, o.strength * 4e3);
			if (o.band === "low") add("BP_Kick_C_1", o.time, vel + 10);
			else if (o.band === "mid") add("BP_Snare_C_1", o.time, vel);
			else if (dens.hats) add("BP_HiHat_C_1", o.time, Math.min(110, vel - 10));
		}
		if (dens.hats) {
			const hatStep = dens.hats >= 16 ? beat / 2 : beat;
			for (let t = offset; t < duration; t += hatStep) {
				if (energyAt(analysis, t) < avgE * .35) continue;
				add("BP_HiHat_C_1", t, 70);
			}
		}
		if (dens.crashes) {
			for (let t = offset; t < duration; t += bar * 4) if (energyAt(analysis, t) > avgE * 1.05) add("BP_Crash15_C_1", t, 110);
		}
	} else {
		const g = GROOVE_BARS[groove];
		const bars = Math.ceil(duration / bar);
		for (let b = 0; b < bars; b++) {
			const barStart = offset + b * bar;
			if (barStart >= duration) break;
			const e = energyAt(analysis, barStart + beat);
			if (e < avgE * .22 && b > 0) continue;
			const kickHits = dens.extraKick ? g.kick : g.kick.map((v, i) => i % 8 === 0 ? v : 0);
			const hatHits = dens.hats === 0 ? EMPTY16 : dens.hats <= 4 ? g.hat.map((v, i) => i % 4 === 0 ? v : 0) : dens.hats <= 8 ? g.hat.map((v, i) => i % 2 === 0 ? v : 0) : g.hat;
			for (let s = 0; s < 16; s++) {
				const t = barStart + s * (beat / 4);
				if (t >= duration) break;
				if (kickHits[s]) pushNote(notes, "BP_Kick_C_1", t, 100 + (s === 0 ? 12 : 0));
				if (g.snare[s]) pushNote(notes, "BP_Snare_C_1", t, 105);
				if (hatHits[s]) pushNote(notes, "BP_HiHat_C_1", t, 72 + (s % 2 === 0 ? 8 : 0));
			}
			if (dens.crashes && b % 4 === 0 && e > avgE * .7) pushNote(notes, "BP_Crash15_C_1", barStart, 118);
			if (dens.fills && (b + 1) % 8 === 0) {
				const fillStart = barStart + beat * 2;
				const toms = [
					"BP_Tom1_C_1",
					"BP_Tom2_C_2",
					"BP_FloorTom_C_1",
					"BP_Snare_C_1"
				];
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
function dedupe(notes) {
	const out = [];
	const last = /* @__PURE__ */ new Map();
	for (const n of notes) {
		const prev = last.get(n.name);
		if (prev !== void 0 && n.time - prev < .04) continue;
		last.set(n.name, n.time);
		out.push(n);
	}
	return out;
}
function filterMidiNotes(notes, difficulty, duration) {
	const dens = densityFor(difficulty);
	const grid = dens.sixteenths ? 4 : 2;
	const beat = .5;
	const out = [];
	const last = /* @__PURE__ */ new Map();
	for (const n of notes) {
		if (n.time > duration) continue;
		if (!dens.hats && n.name === "BP_HiHat_C_1") continue;
		if (!dens.fills && (n.name === "BP_Tom1_C_1" || n.name === "BP_Tom2_C_2" || n.name === "BP_FloorTom_C_1")) {
			if (difficulty === "Easy") continue;
		}
		if (difficulty === "Easy" && (n.name === "BP_Crash15_C_1" || n.name === "BP_Crash17_C_1" || n.name === "BP_Ride17_C_1")) continue;
		const step = beat / grid;
		const q = Math.round(n.time / step) * step;
		const prev = last.get(n.name);
		if (prev !== void 0 && Math.abs(q - prev) < .05) continue;
		last.set(n.name, q);
		out.push({
			...n,
			time: q
		});
	}
	return out.sort((a, b) => a.time - b.time);
}
var DIFFICULTIES = [
	"Easy",
	"Medium",
	"Hard",
	"Expert"
];
var GROOVES = [
	{
		id: "auto",
		label: "Auto map",
		hint: "Onsets from the mix"
	},
	{
		id: "rock",
		label: "Rock",
		hint: "Kick 1/3, snare 2/4"
	},
	{
		id: "pop",
		label: "Pop",
		hint: "Four-on-floor hybrid"
	},
	{
		id: "punk",
		label: "Punk",
		hint: "Driving quarters"
	},
	{
		id: "metal",
		label: "Metal",
		hint: "Double kick 8ths"
	},
	{
		id: "funk",
		label: "Funk",
		hint: "Syncopated kick"
	},
	{
		id: "disco",
		label: "Disco",
		hint: "Four on the floor"
	},
	{
		id: "hiphop",
		label: "Hip-hop",
		hint: "Backbeat pocket"
	}
];
var DRUM_LANES = [
	{
		id: "kick",
		name: "BP_Kick_C_1",
		label: "Kick",
		token: "kick"
	},
	{
		id: "snare",
		name: "BP_Snare_C_1",
		label: "Snare",
		token: "snare"
	},
	{
		id: "hat",
		name: "BP_HiHat_C_1",
		label: "Hi-hat",
		token: "hat"
	},
	{
		id: "crash",
		name: "BP_Crash15_C_1",
		label: "Crash",
		token: "crash"
	},
	{
		id: "crash17",
		name: "BP_Crash17_C_1",
		label: "Crash 17",
		token: "crash"
	},
	{
		id: "ride",
		name: "BP_Ride17_C_1",
		label: "Ride",
		token: "ride"
	},
	{
		id: "tom1",
		name: "BP_Tom1_C_1",
		label: "Tom 1",
		token: "tom"
	},
	{
		id: "tom2",
		name: "BP_Tom2_C_2",
		label: "Tom 2",
		token: "tom"
	},
	{
		id: "floor",
		name: "BP_FloorTom_C_1",
		label: "Floor",
		token: "tom"
	}
];
var savedCreator = () => {
	try {
		return localStorage.getItem("parapack.creator") || "";
	} catch {
		return "";
	}
};
function emptyNotes() {
	return {
		Easy: [],
		Medium: [],
		Hard: [],
		Expert: []
	};
}
var coverObjectUrl = null;
function setCoverUrl(blob) {
	if (coverObjectUrl) {
		URL.revokeObjectURL(coverObjectUrl);
		coverObjectUrl = null;
	}
	if (!blob) return null;
	coverObjectUrl = URL.createObjectURL(blob);
	return coverObjectUrl;
}
async function decodeAudio(file) {
	const ctx = new AudioContext();
	try {
		const copy = await file.arrayBuffer();
		return await ctx.decodeAudioData(copy);
	} finally {
		ctx.close();
	}
}
var useMapper = create((set, get) => ({
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
		set({
			stage: "loading",
			error: null,
			fileName: file.name
		});
		try {
			const id3 = parseId3(await file.arrayBuffer());
			const buffer = await decodeAudio(file);
			const title = id3.title || stripExtension(file.name);
			let coverBlob = null;
			if (id3.picture) {
				const bytes = new Uint8Array(id3.picture.data);
				coverBlob = await rasterizeCover(new Blob([bytes], { type: id3.picture.mime }));
			}
			await get().loadBuffer(buffer, file.name, title);
			const artist = id3.artist || get().artist;
			if (!coverBlob) coverBlob = await generateCover(get().title, artist);
			set({
				artist,
				coverBlob,
				coverUrl: setCoverUrl(coverBlob)
			});
		} catch (err) {
			set({
				stage: "idle",
				error: err instanceof Error ? err.message : "Could not read that audio file."
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
			error: null
		});
		if (!get().coverBlob) {
			const coverBlob = await generateCover(nextTitle, get().artist);
			set({
				coverBlob,
				coverUrl: setCoverUrl(coverBlob)
			});
		}
		get().rebuildNotes();
	},
	async loadMidi(file) {
		try {
			const chart = await importMidi(file);
			set({
				midiNotes: chart.notes,
				midiName: file.name,
				bpm: chart.bpm,
				groove: "auto"
			});
			get().rebuildNotes();
		} catch (err) {
			set({ error: err instanceof Error ? err.message : "Could not read that MIDI file." });
		}
	},
	async setCover(file) {
		try {
			const coverBlob = await rasterizeCover(file);
			set({
				coverBlob,
				coverUrl: setCoverUrl(coverBlob)
			});
		} catch (err) {
			set({ error: err instanceof Error ? err.message : "Could not read that image." });
		}
	},
	setField(patch) {
		if (patch.creator !== void 0) try {
			localStorage.setItem("parapack.creator", patch.creator);
		} catch {}
		set(patch);
		if (patch.bpm !== void 0 || patch.groove !== void 0) get().rebuildNotes();
	},
	toggleDifficulty(d) {
		const current = get().difficulties;
		const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
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
			notesCache: emptyNotes()
		});
	},
	rebuildNotes() {
		const { analysis, groove, midiNotes, bpm } = get();
		if (!analysis) return;
		const analysisWithBpm = {
			...analysis,
			bpm
		};
		const cache = emptyNotes();
		for (const d of DIFFICULTIES) cache[d] = midiNotes ? filterMidiNotes(midiNotes, d, analysis.duration) : generateChart(analysisWithBpm, groove, d);
		set({ notesCache: cache });
	}
}));
function kick(ctx, time) {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(150, time);
	osc.frequency.exponentialRampToValueAtTime(42, time + .12);
	gain.gain.setValueAtTime(.95, time);
	gain.gain.exponentialRampToValueAtTime(.001, time + .28);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start(time);
	osc.stop(time + .3);
}
function snare(ctx, time) {
	const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .2), ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const src = ctx.createBufferSource();
	src.buffer = buffer;
	const bp = ctx.createBiquadFilter();
	bp.type = "bandpass";
	bp.frequency.value = 1800;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(.45, time);
	gain.gain.exponentialRampToValueAtTime(.001, time + .16);
	src.connect(bp);
	bp.connect(gain);
	gain.connect(ctx.destination);
	src.start(time);
	src.stop(time + .18);
	const osc = ctx.createOscillator();
	const og = ctx.createGain();
	osc.frequency.value = 180;
	og.gain.setValueAtTime(.25, time);
	og.gain.exponentialRampToValueAtTime(.001, time + .1);
	osc.connect(og);
	og.connect(ctx.destination);
	osc.start(time);
	osc.stop(time + .12);
}
function hat(ctx, time, open = false) {
	const dur = open ? .18 : .05;
	const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	const src = ctx.createBufferSource();
	src.buffer = buffer;
	const hp = ctx.createBiquadFilter();
	hp.type = "highpass";
	hp.frequency.value = 7e3;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(open ? .22 : .16, time);
	gain.gain.exponentialRampToValueAtTime(.001, time + dur);
	src.connect(hp);
	hp.connect(gain);
	gain.connect(ctx.destination);
	src.start(time);
	src.stop(time + dur);
}
async function renderDemoGroove() {
	const beat = 60 / 120;
	const bars = 8;
	const ctx = new OfflineAudioContext(2, Math.ceil(44100 * 16.4), 44100);
	for (let bar = 0; bar < bars; bar++) {
		const start = bar * 4 * beat;
		for (let b = 0; b < 4; b++) {
			const t = start + b * beat;
			if (b === 0 || b === 2) kick(ctx, t);
			if (b === 1 || b === 3) snare(ctx, t);
			hat(ctx, t, false);
			hat(ctx, t + beat / 2, b === 3);
		}
		if ((bar + 1) % 4 === 0) kick(ctx, start + 3.5 * beat);
	}
	return ctx.startRendering();
}
var ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/flac,audio/aac,audio/mp4,.mp3,.wav,.ogg,.flac,.m4a,.aac";
function DropZone() {
	const loadFile = useMapper((s) => s.loadFile);
	const loadBuffer = useMapper((s) => s.loadBuffer);
	const stage = useMapper((s) => s.stage);
	const error = useMapper((s) => s.error);
	const inputRef = (0, import_react.useRef)(null);
	const [over, setOver] = (0, import_react.useState)(false);
	const [demoBusy, setDemoBusy] = (0, import_react.useState)(false);
	function takeFiles(files) {
		const file = files?.[0];
		if (!file) return;
		const name = file.name.toLowerCase();
		if (name.endsWith(".mid") || name.endsWith(".midi")) return;
		loadFile(file);
	}
	async function loadDemo() {
		setDemoBusy(true);
		try {
			const buffer = await renderDemoGroove();
			await loadBuffer(buffer, "Demo Groove.wav", "Demo Groove");
		} finally {
			setDemoBusy(false);
		}
	}
	const busy = stage === "loading" || demoBusy;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-3xl flex-col items-center px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: busy,
				onClick: () => inputRef.current?.click(),
				onDragOver: (e) => {
					e.preventDefault();
					setOver(true);
				},
				onDragLeave: () => setOver(false),
				onDrop: (e) => {
					e.preventDefault();
					setOver(false);
					takeFiles(e.dataTransfer.files);
				},
				className: cn("group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] border border-dashed px-6 py-16 text-center transition-colors duration-200", over ? "border-accent bg-surface-2" : "border-border bg-surface", "min-h-[340px] shadow-[var(--shadow-panel)]"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DrumHead, { over }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display mt-8 text-4xl text-fg sm:text-5xl",
						children: "Drop an MP3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-pretty text-sm text-muted",
						children: "Converts to a Paradiddle VR song zip: song.ogg, album.png, and Title_Expert.rlrr inside a song folder."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), busy ? "Reading audio…" : "Choose file"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						accept: ACCEPT,
						className: "sr-only",
						onChange: (e) => {
							takeFiles(e.target.files);
							e.target.value = "";
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap items-center justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					onClick: () => void loadDemo(),
					disabled: busy,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drum, { className: "size-4" }), "Load demo groove"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileAudio, { className: "mr-1 inline size-3.5" }), "MP3, WAV, OGG, FLAC"]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm text-danger",
				children: error
			}) : null
		]
	});
}
function DrumHead({ over }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative size-28 rounded-full border-2 transition-transform duration-200", over ? "scale-105 border-accent" : "border-border-strong"),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-3 rounded-full border border-border" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-[22px] rounded-full border border-border-strong" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" })
		]
	});
}
var Input = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	ref,
	className: cn("flex h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 text-sm text-fg", "placeholder:text-subtle transition-[border-color,box-shadow] duration-150", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", "disabled:opacity-40", className),
	...props
}));
Input.displayName = "Input";
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
	ref,
	className: cn("text-xs font-medium tracking-wide text-muted", className),
	...props
}));
Label.displayName = "Label";
function Progress({ value, className }) {
	const pct = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
			style: { width: `${pct}%` }
		})
	});
}
var LANE_FILL = {
	kick: "#d7dde6",
	snare: "#b7bec9",
	hat: "#7b828f",
	crash: "#eceef2",
	ride: "#9aa3b2",
	tom: "#6d7380"
};
function Highway({ notes, duration, currentTime, onSeek }) {
	const canvasRef = (0, import_react.useRef)(null);
	const byLane = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const lane of DRUM_LANES) map.set(lane.name, []);
		for (const n of notes) map.get(n.name)?.push(n);
		return map;
	}, [notes]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = window.devicePixelRatio || 1;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, w, h);
		const labelW = 72;
		const pad = 8;
		const laneH = (h - 16) / DRUM_LANES.length;
		const usable = w - labelW - 16;
		const span = Math.max(duration, .001);
		ctx.fillStyle = "#181b22";
		ctx.fillRect(0, 0, w, h);
		DRUM_LANES.forEach((lane, i) => {
			const y = pad + i * laneH;
			ctx.fillStyle = i % 2 === 0 ? "#181b22" : "#1c2028";
			ctx.fillRect(labelW, y, usable, laneH);
			ctx.fillStyle = "#8b909c";
			ctx.font = "500 11px 'IBM Plex Sans', sans-serif";
			ctx.textBaseline = "middle";
			ctx.fillText(lane.label, 10, y + laneH / 2);
			const hits = byLane.get(lane.name) ?? [];
			ctx.fillStyle = LANE_FILL[lane.token];
			for (const n of hits) {
				const x = labelW + n.time / span * usable;
				const hh = Math.min(10, laneH * .45);
				ctx.globalAlpha = .35 + n.vel / 127 * .65;
				ctx.fillRect(x, y + (laneH - hh) / 2, 3, hh);
			}
			ctx.globalAlpha = 1;
		});
		const px = labelW + currentTime / span * usable;
		ctx.fillStyle = "#c9d0db";
		ctx.fillRect(px, pad, 1.5, h - 16);
	}, [
		byLane,
		duration,
		currentTime
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "h-56 w-full cursor-pointer rounded-[var(--radius-md)]",
		onClick: (e) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const labelW = 72;
			const x = e.clientX - rect.left - labelW;
			const usable = rect.width - labelW - 16;
			if (x < 0) return;
			onSeek?.(Math.max(0, Math.min(duration, x / usable * duration)));
		}
	});
}
function PackTree({ folder, files }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg leading-none text-fg",
					children: folder
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-subtle",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-right",
						children: "Size"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: files.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-border px-4 py-2.5 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate font-medium text-fg",
						children: f.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: f.type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-xs tabular-nums text-muted",
						children: formatBytes(f.bytes)
					})
				]
			}, f.name)) })
		]
	});
}
function Waveform({ buffer, progress, className, onSeek }) {
	const canvasRef = (0, import_react.useRef)(null);
	const peaksRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const data = buffer.getChannelData(0);
		const buckets = 600;
		const peaks = new Float32Array(buckets);
		const hop = Math.floor(data.length / buckets);
		for (let i = 0; i < buckets; i++) {
			let max = 0;
			const start = i * hop;
			for (let j = 0; j < hop; j++) {
				const v = Math.abs(data[start + j] ?? 0);
				if (v > max) max = v;
			}
			peaks[i] = max;
		}
		peaksRef.current = peaks;
	}, [buffer]);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const peaks = peaksRef.current;
		if (!peaks) return;
		const dpr = window.devicePixelRatio || 1;
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		canvas.width = Math.floor(w * dpr);
		canvas.height = Math.floor(h * dpr);
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, w, h);
		const mid = h / 2;
		const barW = w / peaks.length;
		for (let i = 0; i < peaks.length; i++) {
			const amp = Math.max(1, peaks[i] * (h * .42));
			const x = i * barW;
			ctx.fillStyle = i / peaks.length < progress ? "#c9d0db" : "#3c4250";
			ctx.fillRect(x, mid - amp, Math.max(1, barW - .4), amp * 2);
		}
	}, [buffer, progress]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: cn("h-20 w-full cursor-pointer rounded-[var(--radius-sm)] bg-surface-2", className),
		onClick: (e) => {
			const rect = e.currentTarget.getBoundingClientRect();
			onSeek?.((e.clientX - rect.left) / rect.width);
		}
	});
}
var encoderPromise = null;
async function getEncoder() {
	if (!encoderPromise) encoderPromise = I("audio/ogg", "/encoders/ogg.wasm");
	return encoderPromise;
}
function concat(chunks, total) {
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.length;
	}
	return out;
}
async function encodeOggVorbis(buffer, onProgress) {
	const encoder = await getEncoder();
	const channels = Math.min(2, Math.max(1, buffer.numberOfChannels));
	encoder.configure({
		sampleRate: buffer.sampleRate,
		channels,
		vbrQuality: 4
	});
	const left = buffer.getChannelData(0);
	const right = channels === 2 ? buffer.getChannelData(1) : left;
	const frame = 4096;
	const chunks = [];
	let total = 0;
	for (let i = 0; i < left.length; i += frame) {
		const end = Math.min(left.length, i + frame);
		const samples = channels === 2 ? [left.subarray(i, end), right.subarray(i, end)] : [left.subarray(i, end)];
		const encoded = encoder.encode(samples);
		if (encoded.length) {
			const copy = encoded.slice();
			chunks.push(copy);
			total += copy.length;
		}
		if (i % (frame * 12) === 0) {
			onProgress?.(end / left.length * .96);
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
function encodeWav(buffer) {
	const channels = Math.min(2, buffer.numberOfChannels);
	const rate = buffer.sampleRate;
	const samples = buffer.length;
	const blockAlign = channels * 2;
	const dataSize = samples * blockAlign;
	const out = new ArrayBuffer(44 + dataSize);
	const view = new DataView(out);
	const writeStr = (offset, s) => {
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
	const chans = [];
	for (let c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));
	let offset = 44;
	for (let i = 0; i < samples; i++) for (let c = 0; c < channels; c++) {
		const s = Math.max(-1, Math.min(1, chans[c][i] ?? 0));
		view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
		offset += 2;
	}
	return new Uint8Array(out);
}
/** Official ParadiddleUtilities default kit layout. */
var DEFAULT_KIT = [
	{
		name: "BP_HiHat_C_1",
		class: "BP_HiHat_C",
		location: [
			17.22353,
			-34.08699,
			94.211975
		],
		rotation: [
			15.416171,
			19.771341,
			6.125736
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Kick_C_1",
		class: "BP_Kick_C",
		location: [
			-69.758492,
			60.319191,
			34.294422
		],
		rotation: [
			-96.766594,
			2.265444,
			38.000126
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Crash15_C_1",
		class: "BP_Crash15_C",
		location: [
			27.7938,
			-37.487892,
			132.343323
		],
		rotation: [
			17.085356,
			39.032425,
			-19.564053
		],
		scale: [
			1.000001,
			1.000001,
			1
		]
	},
	{
		name: "BP_Crash17_C_1",
		class: "BP_Crash17_C",
		location: [
			26.813931,
			52.215088,
			135.513931
		],
		rotation: [
			-10.405132,
			44.075054,
			25.513369
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_FloorTom_C_1",
		class: "BP_FloorTom_C",
		location: [
			-1.75137,
			42.720551,
			61.630424
		],
		rotation: [
			1.261108,
			28.997799,
			73.703827
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Ride17_C_1",
		class: "BP_Ride17_C",
		location: [
			-14.226593,
			61.129753,
			105.472443
		],
		rotation: [
			-27.074295,
			19.200071,
			15.730481
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Ride20_C_1",
		class: "BP_Ride20_C",
		location: [
			-13.356556,
			77.818153,
			138.67569
		],
		rotation: [
			18.895599,
			42.784584,
			101.073982
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Snare_C_1",
		class: "BP_Snare_C",
		location: [
			17.106194,
			-1.370838,
			68.553436
		],
		rotation: [
			3.194685,
			15.114579,
			1.082093
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Tom1_C_1",
		class: "BP_Tom1_C",
		location: [
			40.340771,
			-2.559204,
			95.154297
		],
		rotation: [
			-40.931034,
			37.27087,
			-55.179005
		],
		scale: [
			1,
			1,
			1
		]
	},
	{
		name: "BP_Tom2_C_2",
		class: "BP_Tom2_C",
		location: [
			30.543972,
			33.849445,
			93.909325
		],
		rotation: [
			14.762558,
			52.847816,
			50.355915
		],
		scale: [
			1,
			1,
			1
		]
	}
];
function buildRlrr(input) {
	const events = input.notes.slice().sort((a, b) => a.time - b.time).map((n) => ({
		name: n.name,
		vel: Math.max(1, Math.min(127, Math.round(n.vel))),
		loc: n.loc,
		time: n.time.toFixed(4)
	}));
	return {
		version: .7,
		authoringTool: "ParaPack Mapper",
		recordingMetadata: {
			title: input.title,
			description: input.description,
			coverImagePath: "album.png",
			artist: input.artist,
			author: input.creator,
			creator: input.creator,
			length: Number(input.length.toFixed(3)),
			complexity: Math.max(1, Math.min(5, Math.round(input.complexity)))
		},
		audioFileData: {
			songTracks: ["song.ogg"],
			drumTracks: [],
			songPreview: "",
			calibrationOffset: Math.round(input.calibrationOffset)
		},
		instruments: DEFAULT_KIT,
		events,
		bpmEvents: [{
			bpm: Number(input.bpm.toFixed(3)),
			time: 0
		}]
	};
}
function serializeRlrr(file) {
	return JSON.stringify(file, null, 4);
}
function packFolderName(title) {
	return title.trim() || "Untitled";
}
function zipDownloadName(title) {
	return `${packFolderName(title)}.zip`;
}
function previewPackFiles(title, difficulties, audioBytes, albumBytes, rlrrBytes, audioName = "song.ogg") {
	const folder = packFolderName(title);
	const audioType = audioName.endsWith(".wav") ? "WAV File" : "OGG File";
	const files = [{
		name: audioName.replace(/\.[^.]+$/, ""),
		type: audioType,
		bytes: audioBytes
	}, {
		name: "album",
		type: "PNG File",
		bytes: albumBytes
	}];
	difficulties.forEach((d, i) => {
		files.push({
			name: `${folder}_${d}.rlrr`,
			type: "RLRR File",
			bytes: rlrrBytes[i] ?? 0
		});
	});
	return files;
}
async function buildParadiddleZip(input) {
	const zip = new import_lib.default();
	const folder = zip.folder(packFolderName(input.title));
	if (!folder) throw new Error("Could not create song folder");
	folder.file(input.audioName, input.audioBytes);
	folder.file("album.png", input.albumBytes);
	const rlrrSizes = [];
	for (const diff of input.difficulties) {
		const json = serializeRlrr(buildRlrr({
			title: input.title,
			artist: input.artist,
			creator: input.creator,
			description: input.description,
			complexity: input.complexity,
			length: input.length,
			bpm: input.bpm,
			calibrationOffset: input.calibrationOffset,
			notes: input.notesFor(diff),
			difficulty: diff
		}));
		const bytes = new TextEncoder().encode(json);
		rlrrSizes.push(bytes.byteLength);
		folder.file(`${packFolderName(input.title)}_${diff}.rlrr`, json);
	}
	return {
		blob: await zip.generateAsync({
			type: "blob",
			compression: "DEFLATE",
			compressionOptions: { level: 6 }
		}),
		files: previewPackFiles(input.title, input.difficulties, input.audioBytes.byteLength, input.albumBytes.byteLength, rlrrSizes, input.audioName)
	};
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function Studio() {
	const state = useMapper();
	const buffer = state.audioBuffer;
	const analysis = state.analysis;
	const midiRef = (0, import_react.useRef)(null);
	const coverRef = (0, import_react.useRef)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [time, setTime] = (0, import_react.useState)(0);
	const [packProgress, setPackProgress] = (0, import_react.useState)(0);
	const sourceRef = (0, import_react.useRef)(null);
	const ctxRef = (0, import_react.useRef)(null);
	const startedAtRef = (0, import_react.useRef)(0);
	const offsetRef = (0, import_react.useRef)(0);
	const previewDiff = state.difficulties.includes("Expert") ? "Expert" : state.difficulties[state.difficulties.length - 1] ?? "Expert";
	const notes = state.notesCache[previewDiff];
	const duration = buffer?.duration ?? 0;
	const previewFiles = (0, import_react.useMemo)(() => {
		if (!buffer || !state.coverBlob) return [];
		const sizes = state.difficulties.map((d) => {
			const json = serializeRlrr(buildRlrr({
				title: state.title || "Untitled",
				artist: state.artist,
				creator: state.creator,
				description: state.description,
				complexity: state.complexity,
				length: duration,
				bpm: state.bpm,
				calibrationOffset: state.calibrationOffset,
				notes: state.notesCache[d],
				difficulty: d
			}));
			return new TextEncoder().encode(json).byteLength;
		});
		const audioBytes = Math.round(buffer.length * .18);
		return previewPackFiles(state.title || "Untitled", state.difficulties, audioBytes, state.coverBlob.size, sizes);
	}, [
		buffer,
		duration,
		state
	]);
	(0, import_react.useEffect)(() => {
		return () => stopPlayback();
	}, []);
	function stopPlayback() {
		sourceRef.current?.stop();
		sourceRef.current?.disconnect();
		sourceRef.current = null;
		setPlaying(false);
	}
	function currentPlaybackTime() {
		const ctx = ctxRef.current;
		if (!ctx || !playing) return time;
		return offsetRef.current + (ctx.currentTime - startedAtRef.current);
	}
	function playFrom(at) {
		if (!buffer) return;
		stopPlayback();
		const ctx = ctxRef.current ?? new AudioContext();
		ctxRef.current = ctx;
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.connect(ctx.destination);
		const start = Math.max(0, Math.min(duration - .05, at));
		src.start(0, start);
		src.onended = () => {
			setPlaying(false);
			setTime(duration);
		};
		sourceRef.current = src;
		startedAtRef.current = ctx.currentTime;
		offsetRef.current = start;
		setTime(start);
		setPlaying(true);
	}
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		let raf = 0;
		const tick = () => {
			const t = currentPlaybackTime();
			if (t >= duration) {
				setTime(duration);
				setPlaying(false);
				return;
			}
			setTime(t);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [playing, duration]);
	async function exportZip() {
		if (!buffer || !state.coverBlob) return;
		if (!state.title.trim()) {
			toast.error("Give the song a title first.");
			return;
		}
		useMapper.setState({
			stage: "packing",
			error: null
		});
		setPackProgress(.04);
		try {
			let audioBytes;
			let audioName = "song.ogg";
			try {
				audioBytes = await encodeOggVorbis(buffer, (p) => setPackProgress(.05 + p * .8));
			} catch (err) {
				console.warn("OGG encode failed, packing WAV", err);
				audioBytes = encodeWav(buffer);
				audioName = "song.wav";
				toast.message("Packed as WAV — OGG encoder unavailable in this browser.");
			}
			setPackProgress(.88);
			const albumBytes = await blobToUint8(state.coverBlob);
			const { blob } = await buildParadiddleZip({
				title: state.title.trim(),
				artist: state.artist.trim(),
				creator: state.creator.trim() || "ParaPack",
				description: state.description,
				complexity: state.complexity,
				length: duration,
				bpm: state.bpm,
				calibrationOffset: state.calibrationOffset,
				difficulties: state.difficulties,
				notesFor: (d) => state.notesCache[d],
				audioBytes,
				audioName,
				albumBytes
			});
			setPackProgress(1);
			downloadBlob(blob, zipDownloadName(state.title.trim()));
			toast.success("Song pack downloaded.");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Export failed.";
			useMapper.setState({ error: message });
			toast.error(message);
		} finally {
			useMapper.setState({ stage: "ready" });
			setTimeout(() => setPackProgress(0), 600);
		}
	}
	if (!buffer || !analysis) return null;
	const packing = state.stage === "packing";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-[var(--shadow-panel)] lg:sticky lg:top-20 lg:self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-2",
						onClick: () => coverRef.current?.click(),
						children: state.coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: state.coverUrl,
							alt: "Album cover",
							className: "size-full object-cover"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex size-full items-center justify-center text-subtle",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-6" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-wider text-subtle",
								children: "Cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-pretty text-sm text-muted",
								children: "Square PNG, named album.png in the pack. Click to replace."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: coverRef,
								type: "file",
								accept: "image/png,image/jpeg,image/webp",
								className: "sr-only",
								onChange: (e) => {
									const f = e.target.files?.[0];
									if (f) state.setCover(f);
									e.target.value = "";
								}
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Song title",
					htmlFor: "title",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "title",
						value: state.title,
						onChange: (e) => state.setField({ title: e.target.value }),
						placeholder: "Planetary (GO!)"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Artist",
					htmlFor: "artist",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "artist",
						value: state.artist,
						onChange: (e) => state.setField({ artist: e.target.value }),
						placeholder: "Artist name"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Mapper / author",
					htmlFor: "creator",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "creator",
						value: state.creator,
						onChange: (e) => state.setField({ creator: e.target.value }),
						placeholder: "Your name"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Description",
					htmlFor: "desc",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "desc",
						value: state.description,
						onChange: (e) => state.setField({ description: e.target.value })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: `BPM · ${state.bpm.toFixed(1)}`,
						htmlFor: "bpm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "bpm",
							type: "number",
							min: 60,
							max: 220,
							step: .1,
							value: state.bpm,
							onChange: (e) => state.setField({ bpm: Number(e.target.value) || 120 })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: `Complexity ${state.complexity}/5`,
						htmlFor: "cx",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "cx",
							type: "number",
							min: 1,
							max: 5,
							value: state.complexity,
							onChange: (e) => state.setField({ complexity: Number(e.target.value) || 1 })
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Groove" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: GROOVES.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							title: g.hint,
							onClick: () => state.setField({ groove: g.id }),
							className: cn("h-8 rounded-full border px-3 text-xs font-medium", state.groove === g.id ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface-2 text-muted hover:text-fg"),
							children: g.label
						}, g.id))
					}),
					state.midiName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted",
						children: ["Using MIDI: ", state.midiName]
					}) : null
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Difficulties" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: DIFFICULTIES.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => state.toggleDifficulty(d),
						className: cn("h-8 rounded-full border px-3 text-xs font-medium", state.difficulties.includes(d) ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface-2 text-muted hover:text-fg"),
						children: d
					}, d))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: () => midiRef.current?.click(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Replace chart with MIDI"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: midiRef,
					type: "file",
					accept: ".mid,.midi,audio/midi",
					className: "sr-only",
					onChange: (e) => {
						const f = e.target.files?.[0];
						if (f) state.loadMidi(f);
						e.target.value = "";
					}
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex min-w-0 flex-col gap-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[var(--radius-xl)] border border-border bg-surface p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl text-fg",
								children: state.title || "Untitled"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									formatClock(duration),
									" · ",
									notes.length.toLocaleString(),
									" notes · ",
									previewDiff
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								"aria-label": playing ? "Pause" : "Play",
								onClick: () => playing ? stopPlayback() : playFrom(time >= duration - .05 ? 0 : time),
								children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
							buffer,
							progress: duration ? time / duration : 0,
							onSeek: (r) => playFrom(r * duration)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs font-medium uppercase tracking-wider text-subtle",
							children: ["Note highway · ", previewDiff]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Highway, {
								notes,
								duration,
								currentTime: time,
								onSeek: (t) => playFrom(t)
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackTree, {
					folder: packFolderName(state.title || "Untitled"),
					files: previewFiles
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[var(--radius-xl)] border border-border bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl text-fg",
							children: "Export zip"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-pretty text-sm text-muted",
							children: "Unzip into Documents/Paradiddle/Songs so the folder name matches the .rlrr title. Quest: copy that folder to Paradiddle/Songs."
						}),
						packing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
							value: packProgress * 100,
							className: "mt-4"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => void exportZip(),
								disabled: packing,
								size: "lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), packing ? "Building pack…" : "Download song pack"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								onClick: () => state.reset(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {}), "Start over"]
							})]
						}),
						state.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-danger",
							children: state.error
						}) : null
					]
				})
			]
		})]
	});
}
function Field({ label, htmlFor, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor,
			children: label
		}), children]
	});
}
function Home() {
	const stage = useMapper((s) => s.stage);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border/80 bg-bg/85 px-4 py-3 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative grid size-8 place-items-center rounded-full border border-border-strong",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-accent" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl leading-none text-fg",
							children: "ParaPack"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] uppercase tracking-[0.16em] text-subtle",
							children: "Paradiddle VR mapper"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "hidden text-xs text-muted sm:block",
						children: "song.ogg · album.png · Title_Expert.rlrr"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "py-10 sm:py-14",
				children: !(stage === "ready" || stage === "packing") ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto mb-10 max-w-2xl px-4 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-5xl text-fg sm:text-6xl",
							children: "Map it. Pack it. Play it."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mx-auto mt-3 max-w-lg text-pretty text-base text-muted",
							children: "Upload a track. ParaPack detects a groove, writes a .rlrr chart, converts audio to OGG, and zips a Paradiddle-ready song folder."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropZone, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-center",
				richColors: false
			})
		]
	});
}
function HowItWorks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto mt-16 grid max-w-5xl gap-4 px-4 sm:grid-cols-3",
		children: [
			{
				n: "01",
				t: "Audio in",
				d: "Drop an MP3 (or WAV/OGG). Title and cover pull from tags when they’re there."
			},
			{
				n: "02",
				t: "Chart",
				d: "Auto-map from the mix, pick a groove, or swap in a MIDI drum track."
			},
			{
				n: "03",
				t: "Zip out",
				d: "Folder named after the song, containing song.ogg, album.png, and Title_Expert.rlrr."
			}
		].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "rounded-[var(--radius-lg)] border border-border bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs text-subtle",
					children: s.n
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-2xl text-fg",
					children: s.t
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-pretty text-sm text-muted",
					children: s.d
				})
			]
		}, s.n))
	});
}
//#endregion
export { Home as component };
