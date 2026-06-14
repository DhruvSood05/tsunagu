"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { RiSearchLine, RiCloseLine } from "@remixicon/react";

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
    <div className="relative flex items-center">
      <RiSearchLine className="absolute left-2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by subject..."
        className="pl-7 pr-7 h-8 text-xs"
      />
      {value && (
        <button
          onClick={() => { setValue(""); lastFired.current = ""; onClear(); }}
          className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <RiCloseLine className="size-3.5" />
        </button>
      )}
    </div>
  );
}
