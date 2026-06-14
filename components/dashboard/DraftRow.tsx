"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiMoreLine, RiEditLine, RiDeleteBinLine } from "@remixicon/react";

interface DraftRowProps {
  draft: { id: string };
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}

function ThreeDotMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((o) => !o)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        <RiMoreLine />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border shadow-md z-20 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
          >
            <RiEditLine className="size-3.5" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          >
            <RiDeleteBinLine className="size-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function DraftRow({ draft, selected, onClick, onDelete }: DraftRowProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/60 transition-colors ${
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/50 border-l-2 border-l-transparent"
      }`}
    >
      <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground border-border">
        Draft
      </Badge>
      <span className="flex-1 truncate text-xs text-muted-foreground">(no subject)</span>
      <ThreeDotMenu onEdit={onClick} onDelete={() => onDelete(draft.id)} />
    </div>
  );
}
