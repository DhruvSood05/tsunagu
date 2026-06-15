"use client";

import { useEffect, useRef, useState } from "react";
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
        size="icon-xs"
        onClick={() => setOpen((o) => !o)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-lg cursor-pointer size-6 hover:bg-secondary"
      >
        <RiMoreLine className="size-3.5 text-muted-foreground/80 hover:text-foreground" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border shadow-xl z-20 overflow-hidden rounded-lg animate-in fade-in duration-100">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <RiEditLine className="size-3.5 text-muted-foreground/60" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-xs text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
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
  const draftSubject = draft && (draft as any).subject ? (draft as any).subject : "(no subject)";
  const draftBody = draft && (draft as any).body ? (draft as any).body : "";

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b border-border/20 transition-all duration-200 select-none font-sans ${
        selected
          ? "bg-secondary/60 border-l-2 border-l-foreground shadow-inner"
          : "hover:bg-secondary/25 border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[8.5px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-lg leading-none bg-[#fb923c]/15 text-[#fb923c] border border-[#fb923c]/25">
            draft
          </span>
          <ThreeDotMenu onEdit={onClick} onDelete={() => onDelete(draft.id)} />
        </div>
        <p className="text-xs font-semibold text-foreground truncate mb-1 tracking-tight font-heading">
          {draftSubject}
        </p>
        <p className="text-[10.5px] text-muted-foreground/65 truncate leading-relaxed">
          {draftBody || "Empty draft message"}
        </p>
      </div>
    </div>
  );
}
