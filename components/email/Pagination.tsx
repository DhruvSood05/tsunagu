import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  loading: boolean;
}

export default function Pagination({ page, hasPrev, hasNext, onPrev, onNext, loading }: PaginationProps) {
  if (!hasPrev && !hasNext) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-card shrink-0 select-none font-sans">
      <button
        onClick={onPrev}
        disabled={!hasPrev || loading}
        className="flex items-center gap-1 h-8 pl-2 pr-3.5 rounded-full font-semibold text-[11px] cursor-pointer text-muted-foreground border border-border/50 bg-card hover:text-foreground hover:bg-secondary/50 hover:shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97]"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Prev
      </button>

      <span className="text-[10px] text-muted-foreground/70 font-mono font-medium tracking-wide tabular-nums">
        Page {page}
      </span>

      <button
        onClick={onNext}
        disabled={!hasNext || loading}
        className="flex items-center gap-1 h-8 pl-3.5 pr-2 rounded-full font-semibold text-[11px] cursor-pointer text-muted-foreground border border-border/50 bg-card hover:text-foreground hover:bg-secondary/50 hover:shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-[0.97]"
      >
        Next
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
