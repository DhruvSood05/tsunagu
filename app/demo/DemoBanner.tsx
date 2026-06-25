"use client";

import { FlaskConical, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useDemoContext } from "@/lib/demo/DemoContext";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { resetDemo } = useDemoContext();

  if (dismissed) return null;

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 text-[12px] font-medium font-sans z-40">
      <div className="flex items-center gap-2.5 min-w-0">
        <FlaskConical className="size-3.5 text-primary shrink-0" strokeWidth={1.75} />
        <span className="text-foreground/80 truncate">
          <span className="font-semibold text-primary">Demo Workspace</span>
          {" — "}
          Exploring Tsunagu with sample emails and calendar events. AI actions and account syncing are disabled.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={resetDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          title="Reset demo data to defaults"
        >
          <RotateCcw className="size-3" strokeWidth={1.75} />
          Reset
        </button>
        <button
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Sign in to continue
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="size-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
