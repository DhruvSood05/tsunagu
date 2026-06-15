"use client";

import { Button } from "@/components/ui/button";
import {
  RiCalendarLine,
  RiGoogleFill,
  RiTimeLine,
  RiMailLine,
  RiRobot2Line,
  RiShieldCheckLine,
} from "@remixicon/react";
import Link from "next/link";

const FEATURES = [
  { icon: RiTimeLine, text: "See upcoming meetings right inside your inbox" },
  { icon: RiMailLine, text: "Turn emails into calendar events with one click" },
  { icon: RiRobot2Line, text: "AI agent can schedule meetings and send invites on your behalf" },
  { icon: RiShieldCheckLine, text: "Calendar access is encrypted and scoped to your account only" },
];

export default function ConnectCalendar() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background select-none font-sans">
      {/* Atmospheric depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-1/3 -right-1/4 h-140 w-140 rounded-full bg-violet-500/6 dark:bg-violet-500/9 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 h-110 w-110 rounded-full bg-indigo-500/5 dark:bg-indigo-500/7 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <div className="size-7 rounded-lg bg-foreground flex items-center justify-center shadow-md">
            <span className="text-background text-[11px] font-bold tracking-tighter font-heading">T</span>
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground font-serif">Tsunagu</span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest font-heading">
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/40 text-muted-foreground/50">Step 1 ✓</span>
          <span className="text-border/60">·</span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/40 text-muted-foreground/50">Step 2 ✓</span>
          <span className="text-border/60">·</span>
          <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-border/60 text-foreground">Step 3</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-md mx-auto gap-7">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 font-heading animate-in fade-in duration-300">
          <RiCalendarLine className="size-3" />
          Connect Calendar
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-serif tracking-tight leading-[1.05] text-foreground animate-in fade-in slide-in-from-bottom-4 duration-400">
          Your schedule,<br />
          <span className="italic text-muted-foreground">always in context.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-88 animate-in fade-in duration-500 delay-75">
          Connect your Google Calendar so Tsunagu can show your upcoming events and create new ones from emails.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-70 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Button
            className="w-full gap-2 h-11 px-6 font-semibold text-sm rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => { window.location.href = "/api/connect?plugin=googlecalendar"; }}
          >
            <RiGoogleFill className="size-4" />
            Connect Google Calendar
          </Button>

          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/35 text-left w-full">
            <RiCalendarLine className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground/60 leading-snug font-medium">
              Uses the same Google account as Gmail — no additional sign-in required.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm animate-in fade-in duration-600 delay-150">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/35 text-left"
            >
              <Icon className="size-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground/80 leading-snug font-medium">{text}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Legal footer */}
      <footer className="absolute bottom-6 text-center px-8">
        <p className="text-[10px] text-muted-foreground/25 leading-relaxed">
          Your calendar data stays private. Tsunagu only reads events to display them and creates events you explicitly approve.
        </p>
      </footer>
    </div>
  );
}
