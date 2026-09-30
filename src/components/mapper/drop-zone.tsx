import { useRef, useState } from "react";
import { Drum, FileAudio, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapper } from "@/lib/paradiddle/store";
import { renderDemoGroove } from "@/lib/paradiddle/demo-audio";
import { cn } from "@/lib/utils";

const ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/flac,audio/aac,audio/mp4,.mp3,.wav,.ogg,.flac,.m4a,.aac";

export function DropZone() {
  const loadFile = useMapper((s) => s.loadFile);
  const loadBuffer = useMapper((s) => s.loadBuffer);
  const stage = useMapper((s) => s.stage);
  const error = useMapper((s) => s.error);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  function takeFiles(files: FileList | File[] | null) {
    const file = files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".mid") || name.endsWith(".midi")) {
      return;
    }
    void loadFile(file);
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={busy}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          takeFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[var(--radius-2xl)] border border-dashed px-6 py-16 text-center transition-colors duration-200",
          over ? "border-accent bg-surface-2" : "border-border bg-surface",
          "min-h-[340px] shadow-[var(--shadow-panel)]",
          busy ? "opacity-60" : "",
        )}
      >
        <DrumHead over={over} />
        <p className="font-display mt-8 text-4xl text-fg sm:text-5xl">Drop an MP3</p>
        <p className="mt-2 max-w-md text-pretty text-sm text-muted">
          Converts to a Paradiddle VR song zip: song.ogg, album.png, and Title_Expert.rlrr inside a song folder.
        </p>
        <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg">
          <Upload className="size-4" />
          {busy ? "Reading audio…" : "Choose file"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          takeFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={() => void loadDemo()} disabled={busy}>
          <Drum className="size-4" />
          Load demo groove
        </Button>
        <p className="text-xs text-subtle">
          <FileAudio className="mr-1 inline size-3.5" />
          MP3, WAV, OGG, FLAC
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function DrumHead({ over }: { over: boolean }) {
  return (
    <div
      className={cn(
        "relative size-28 rounded-full border-2 transition-transform duration-200",
        over ? "scale-105 border-accent" : "border-border-strong",
      )}
      aria-hidden
    >
      <div className="absolute inset-3 rounded-full border border-border" />
      <div className="absolute inset-[22px] rounded-full border border-border-strong" />
      <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}
