"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (q: string) => void;
  onClear: () => void;
}

export default function SearchBar({ onSearch, onClear }: SearchBarProps) {
  const [value, setValue] = useState("");
  const lastFired = useRef("");

  useEffect(() => {
    const trimmed = value.trim();
    const timer = setTimeout(() => {
      if (trimmed === lastFired.current) return;
      lastFired.current = trimmed;
      if (trimmed) onSearch(trimmed);
      else onClear();
    }, 400);
    return () => clearTimeout(timer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex items-center w-full font-sans select-none">
      <Search className="absolute left-3.5 size-4 text-muted-foreground/60 pointer-events-none" strokeWidth={1.75} />
      <Input
        id="workspace-search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search inbox..."
        className="pl-10 pr-8 h-10 text-xs bg-secondary/50 border border-border/40 rounded-lg focus-visible:ring-1 focus-visible:ring-foreground/30 transition-all placeholder:text-muted-foreground/45"
      />
      {value && (
        <button
          onClick={() => { setValue(""); lastFired.current = ""; onClear(); }}
          className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
