import { useEffect, useMemo, useRef } from "react";
import { DRUM_LANES, type DrumNote } from "@/lib/paradiddle/types";

const LANE_FILL: Record<string, string> = {
  kick: "#d7dde6",
  snare: "#b7bec9",
  hat: "#7b828f",
  crash: "#eceef2",
  ride: "#9aa3b2",
  tom: "#6d7380",
};

export function Highway({
  notes,
  duration,
  currentTime,
  onSeek,
}: {
  notes: DrumNote[];
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const byLane = useMemo(() => {
    const map = new Map<string, DrumNote[]>();
    for (const lane of DRUM_LANES) map.set(lane.name, []);
    for (const n of notes) map.get(n.name)?.push(n);
    return map;
  }, [notes]);

  useEffect(() => {
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
    const laneH = (h - pad * 2) / DRUM_LANES.length;
    const usable = w - labelW - 16;
    const span = Math.max(duration, 0.001);

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
        const x = labelW + (n.time / span) * usable;
        const hh = Math.min(10, laneH * 0.45);
        ctx.globalAlpha = 0.35 + (n.vel / 127) * 0.65;
        ctx.fillRect(x, y + (laneH - hh) / 2, 3, hh);
      }
      ctx.globalAlpha = 1;
    });

    const px = labelW + (currentTime / span) * usable;
    ctx.fillStyle = "#c9d0db";
    ctx.fillRect(px, pad, 1.5, h - pad * 2);
  }, [byLane, duration, currentTime]);

  return (
    <canvas
      ref={canvasRef}
      className="h-56 w-full cursor-pointer rounded-[var(--radius-md)]"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const labelW = 72;
        const x = e.clientX - rect.left - labelW;
        const usable = rect.width - labelW - 16;
        if (x < 0) return;
        onSeek?.(Math.max(0, Math.min(duration, (x / usable) * duration)));
      }}
    />
  );
}
