"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";
import { RiSunLine, RiMoonLine } from "@remixicon/react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-9 rounded-lg bg-secondary/40 shrink-0" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-9 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground border border-transparent hover:text-foreground hover:bg-card hover:border-border/60 hover:shadow-sm transition-all duration-200 active:scale-90 cursor-pointer"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <RiSunLine className="size-4.5 text-amber-400 transition-transform duration-300" />
      ) : (
        <RiMoonLine className="size-4.5 text-indigo-500 transition-transform duration-300" />
      )}
    </button>
  );
}
