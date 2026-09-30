import { Folder } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { PackFile } from "@/lib/paradiddle/types";

export function PackTree({
  folder,
  files,
}: {
  folder: string;
  files: PackFile[];
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <Folder className="size-4 text-muted" />
        <p className="font-display text-lg leading-none text-fg">{folder}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-subtle">
        <span>Name</span>
        <span>Type</span>
        <span className="text-right">Size</span>
      </div>
      <ul>
        {files.map((f) => (
          <li
            key={f.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-t border-border px-4 py-2.5 text-sm"
          >
            <span className="truncate font-medium text-fg">{f.name}</span>
            <span className="text-muted">{f.type}</span>
            <span className="font-mono text-xs tabular-nums text-muted">{formatBytes(f.bytes)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
