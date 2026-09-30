import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Waveform({
  buffer,
  progress,
  className,
  onSeek,
}: {
  buffer: AudioBuffer;
  progress: number;
  className?: string;
  onSeek?: (ratio: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peaksRef = useRef<Float32Array | null>(null);

  useEffect(() => {
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

  useEffect(() => {
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
      const amp = Math.max(1, peaks[i] * (h * 0.42));
      const x = i * barW;
      const played = i / peaks.length < progress;
      ctx.fillStyle = played ? "#c9d0db" : "#3c4250";
      ctx.fillRect(x, mid - amp, Math.max(1, barW - 0.4), amp * 2);
    }
  }, [buffer, progress]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-20 w-full cursor-pointer rounded-[var(--radius-sm)] bg-surface-2", className)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek?.((e.clientX - rect.left) / rect.width);
      }}
    />
  );
}
