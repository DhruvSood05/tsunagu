"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="size-8 rounded-lg bg-secondary/40 shrink-0" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground border border-transparent hover:text-foreground hover:bg-card hover:border-border/50 transition-all duration-200 active:scale-90 cursor-pointer"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400 transition-transform duration-300" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4 text-muted-foreground transition-transform duration-300" strokeWidth={1.75} />
      )}
    </button>
  );
}
