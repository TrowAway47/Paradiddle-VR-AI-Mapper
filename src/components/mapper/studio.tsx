import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, ImagePlus, Pause, Play, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Highway } from "@/components/mapper/highway";
import { PackTree } from "@/components/mapper/pack-tree";
import { Waveform } from "@/components/mapper/waveform";
import { blobToUint8 } from "@/lib/paradiddle/album-art";
import { encodeOggVorbis, encodeWav } from "@/lib/paradiddle/ogg-encode";
import { buildParadiddleZip, downloadBlob, packFolderName, previewPackFiles, zipDownloadName } from "@/lib/paradiddle/pack";
import { serializeRlrr, buildRlrr } from "@/lib/paradiddle/rlrr";
import { useMapper } from "@/lib/paradiddle/store";
import { DIFFICULTIES, GROOVES, type Difficulty } from "@/lib/paradiddle/types";
import { cn, formatClock } from "@/lib/utils";

export function Studio() {
  const state = useMapper();
  const buffer = state.audioBuffer;
  const analysis = state.analysis;
  const midiRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [packProgress, setPackProgress] = useState(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);

  const previewDiff: Difficulty = state.difficulties.includes("Expert")
    ? "Expert"
    : (state.difficulties[state.difficulties.length - 1] ?? "Expert");
  const notes = state.notesCache[previewDiff];
  const duration = buffer?.duration ?? 0;

  const previewFiles = useMemo(() => {
    if (!buffer || !state.coverBlob) return [];
    const sizes = state.difficulties.map((d) => {
      const json = serializeRlrr(
        buildRlrr({
          title: state.title || "Untitled",
          artist: state.artist,
          creator: state.creator,
          description: state.description,
          complexity: state.complexity,
          length: duration,
          bpm: state.bpm,
          calibrationOffset: state.calibrationOffset,
          notes: state.notesCache[d],
          difficulty: d,
        }),
      );
      return new TextEncoder().encode(json).byteLength;
    });
    const audioBytes = Math.round(buffer.length * 0.18);
    return previewPackFiles(
      state.title || "Untitled",
      state.difficulties,
      audioBytes,
      state.coverBlob.size,
      sizes,
    );
  }, [buffer, duration, state]);

  useEffect(() => {
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

  function playFrom(at: number) {
    if (!buffer) return;
    stopPlayback();
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const start = Math.max(0, Math.min(duration - 0.05, at));
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

  useEffect(() => {
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
    useMapper.setState({ stage: "packing", error: null });
    setPackProgress(0.04);
    try {
      let audioBytes: Uint8Array;
      let audioName: "song.ogg" | "song.wav" = "song.ogg";
      try {
        audioBytes = await encodeOggVorbis(buffer, (p) => setPackProgress(0.05 + p * 0.8));
      } catch (err) {
        console.warn("OGG encode failed, packing WAV", err);
        audioBytes = encodeWav(buffer);
        audioName = "song.wav";
        toast.message("Packed as WAV — OGG encoder unavailable in this browser.");
      }
      setPackProgress(0.88);
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
        albumBytes,
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

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-[var(--shadow-panel)] lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-2"
            onClick={() => coverRef.current?.click()}
          >
            {state.coverUrl ? (
              <img src={state.coverUrl} alt="Album cover" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-subtle">
                <ImagePlus className="size-6" />
              </span>
            )}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-subtle">Cover</p>
            <p className="mt-1 text-pretty text-sm text-muted">Square PNG, named album.png in the pack. Click to replace.</p>
            <input
              ref={coverRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void state.setCover(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <Field label="Song title" htmlFor="title">
          <Input
            id="title"
            value={state.title}
            onChange={(e) => state.setField({ title: e.target.value })}
            placeholder="Planetary (GO!)"
          />
        </Field>
        <Field label="Artist" htmlFor="artist">
          <Input
            id="artist"
            value={state.artist}
            onChange={(e) => state.setField({ artist: e.target.value })}
            placeholder="Artist name"
          />
        </Field>
        <Field label="Mapper / author" htmlFor="creator">
          <Input
            id="creator"
            value={state.creator}
            onChange={(e) => state.setField({ creator: e.target.value })}
            placeholder="Your name"
          />
        </Field>
        <Field label="Description" htmlFor="desc">
          <Input
            id="desc"
            value={state.description}
            onChange={(e) => state.setField({ description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`BPM · ${state.bpm.toFixed(1)}`} htmlFor="bpm">
            <Input
              id="bpm"
              type="number"
              min={60}
              max={220}
              step={0.1}
              value={state.bpm}
              onChange={(e) => state.setField({ bpm: Number(e.target.value) || 120 })}
            />
          </Field>
          <Field label={`Complexity ${state.complexity}/5`} htmlFor="cx">
            <Input
              id="cx"
              type="number"
              min={1}
              max={5}
              value={state.complexity}
              onChange={(e) => state.setField({ complexity: Number(e.target.value) || 1 })}
            />
          </Field>
        </div>

        <div>
          <Label>Groove</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GROOVES.map((g) => (
              <button
                key={g.id}
                type="button"
                title={g.hint}
                onClick={() => state.setField({ groove: g.id })}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium",
                  state.groove === g.id
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
          {state.midiName ? (
            <p className="mt-2 text-xs text-muted">Using MIDI: {state.midiName}</p>
          ) : null}
        </div>

        <div>
          <Label>Difficulties</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => state.toggleDifficulty(d)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium",
                  state.difficulties.includes(d)
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={() => midiRef.current?.click()}>
          <Upload className="size-4" />
          Replace chart with MIDI
        </Button>
        <input
          ref={midiRef}
          type="file"
          accept=".mid,.midi,audio/midi"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void state.loadMidi(f);
            e.target.value = "";
          }}
        />
      </aside>

      <section className="flex min-w-0 flex-col gap-5">
        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl text-fg">{state.title || "Untitled"}</p>
              <p className="text-sm text-muted">
                {formatClock(duration)} · {notes.length.toLocaleString()} notes · {previewDiff}
              </p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              aria-label={playing ? "Pause" : "Play"}
              onClick={() => (playing ? stopPlayback() : playFrom(time >= duration - 0.05 ? 0 : time))}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
          </div>
          <Waveform
            buffer={buffer}
            progress={duration ? time / duration : 0}
            onSeek={(r) => playFrom(r * duration)}
          />
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-subtle">Note highway · {previewDiff}</p>
          <div className="mt-2">
            <Highway notes={notes} duration={duration} currentTime={time} onSeek={(t) => playFrom(t)} />
          </div>
        </div>

        <PackTree folder={packFolderName(state.title || "Untitled")} files={previewFiles} />

        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5">
          <p className="font-display text-xl text-fg">Export zip</p>
          <p className="mt-1 text-pretty text-sm text-muted">
            Unzip into Documents/Paradiddle/Songs so the folder name matches the .rlrr title. Quest: copy that folder to Paradiddle/Songs.
          </p>
          {packing ? <Progress value={packProgress * 100} className="mt-4" /> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void exportZip()} disabled={packing} size="lg">
              <Download />
              {packing ? "Building pack…" : "Download song pack"}
            </Button>
            <Button variant="ghost" onClick={() => state.reset()}>
              <RotateCcw />
              Start over
            </Button>
          </div>
          {state.error ? <p className="mt-3 text-sm text-danger">{state.error}</p> : null}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
