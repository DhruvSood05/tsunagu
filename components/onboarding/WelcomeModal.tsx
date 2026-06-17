"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  RiSparkling2Fill,
  RiInboxLine,
  RiCalendarLine,
  RiArrowRightLine,
} from "@remixicon/react";

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

const HIGHLIGHTS = [
  {
    icon: RiSparkling2Fill,
    label: "AI Assistant",
    description: "Draft, summarize & schedule by chatting",
    iconClass: "text-primary bg-primary/10",
  },
  {
    icon: RiInboxLine,
    label: "Smart Inbox",
    description: "Priority-ranked email, zero clutter",
    iconClass: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: RiCalendarLine,
    label: "Unified Calendar",
    description: "Manage events & invites in one place",
    iconClass: "text-emerald-500 bg-emerald-500/10",
  },
];

export default function WelcomeModal({ open, onStartTour, onSkip }: WelcomeModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onSkip]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center font-sans p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border/60 rounded-xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Hero */}
        <div className="flex flex-col items-center text-center px-7 pt-9 pb-6">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-2xl animate-pulse-glow" />
            <div className="relative size-14 rounded-lg bg-linear-to-tr from-primary/80 to-primary flex items-center justify-center shadow-lg">
              <RiSparkling2Fill className="size-7 text-background" />
            </div>
          </div>

          <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/15 px-2.5 py-0.5 rounded-md uppercase tracking-widest mb-3">
            Welcome aboard
          </span>

          <h2 className="text-xl font-bold text-foreground tracking-tight font-heading">
            Welcome to Tsunagu
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs leading-relaxed">
            Your AI-powered command center for email and calendar. Let&apos;s take 30 seconds to show you around.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="px-7 space-y-2">
          {HIGHLIGHTS.map(({ icon: Icon, label, description, iconClass }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/30"
            >
              <div className={`size-9 shrink-0 rounded-lg flex items-center justify-center ${iconClass}`}>
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="px-7 pt-6 pb-7 flex flex-col items-center gap-3">
          <Button
            onClick={onStartTour}
            className="w-full h-10 rounded-md text-xs font-semibold gap-1.5 cursor-pointer group"
          >
            Take a quick tour
            <RiArrowRightLine className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <button
            onClick={onSkip}
            className="text-[11px] font-medium text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
