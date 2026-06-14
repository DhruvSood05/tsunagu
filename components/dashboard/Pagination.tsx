import { Button } from "@/components/ui/button";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";

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
    <div className="flex items-center justify-between px-4 py-2.5 border-t bg-background shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={!hasPrev || loading}
        className="gap-1 h-7"
      >
        <RiArrowLeftSLine className="size-3.5" />
        Prev
      </Button>

      <span className="text-[11px] text-muted-foreground">Page {page}</span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={!hasNext || loading}
        className="gap-1 h-7"
      >
        Next
        <RiArrowRightSLine className="size-3.5" />
      </Button>
    </div>
  );
}
