import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { DropZone } from "@/components/mapper/drop-zone";
import { Studio } from "@/components/mapper/studio";
import { useMapper } from "@/lib/paradiddle/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const stage = useMapper((s) => s.stage);
  const ready = stage === "ready" || stage === "packing";

  return (
    <div className="min-h-screen text-fg">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/85 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative grid size-8 place-items-center rounded-full border border-border-strong">
              <span className="size-2 rounded-full bg-accent" />
            </span>
            <div>
              <p className="font-display text-xl leading-none text-fg">ParaPack</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Paradiddle VR mapper</p>
            </div>
          </div>
          <p className="hidden text-xs text-muted sm:block">song.ogg · album.png · Title_Expert.rlrr</p>
        </div>
      </header>

      <main className="py-10 sm:py-14">
        {!ready ? (
          <>
            <div className="mx-auto mb-10 max-w-2xl px-4 text-center">
              <h1 className="font-display text-5xl text-fg sm:text-6xl">Map it. Pack it. Play it.</h1>
              <p className="mx-auto mt-3 max-w-lg text-pretty text-base text-muted">
                Upload a track. ParaPack detects a groove, writes a .rlrr chart, converts audio to OGG, and zips a Paradiddle-ready song folder.
              </p>
            </div>
            <DropZone />
            <HowItWorks />
          </>
        ) : (
          <Studio />
        )}
      </main>
      <Toaster theme="dark" position="bottom-center" richColors={false} />
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Audio in",
      d: "Drop an MP3 (or WAV/OGG). Title and cover pull from tags when they’re there.",
    },
    {
      n: "02",
      t: "Chart",
      d: "Auto-map from the mix, pick a groove, or swap in a MIDI drum track.",
    },
    {
      n: "03",
      t: "Zip out",
      d: "Folder named after the song, containing song.ogg, album.png, and Title_Expert.rlrr.",
    },
  ];
  return (
    <section className="mx-auto mt-16 grid max-w-5xl gap-4 px-4 sm:grid-cols-3">
      {steps.map((s) => (
        <article key={s.n} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="font-mono text-xs text-subtle">{s.n}</p>
          <h2 className="mt-2 font-display text-2xl text-fg">{s.t}</h2>
          <p className="mt-2 text-pretty text-sm text-muted">{s.d}</p>
        </article>
      ))}
    </section>
  );
}
