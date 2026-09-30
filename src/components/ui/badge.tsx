import { cn } from "@/lib/utils";

export function Badge({
  className,
  active,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium",
        active
          ? "border-accent bg-accent text-accent-fg"
          : "border-border bg-surface-2 text-muted",
        className,
      )}
      {...props}
    />
  );
}
