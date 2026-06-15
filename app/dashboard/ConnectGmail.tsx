"use client";

import { Button } from "@/components/ui/button";
import {
  RiGoogleFill,
  RiInboxLine,
  RiShieldCheckLine,
  RiSendPlaneLine,
  RiSparkling2Fill,
} from "@remixicon/react";
import Link from "next/link";

const FEATURES = [
  { icon: RiInboxLine, text: "Unified inbox with smart category tabs" },
  { icon: RiSendPlaneLine, text: "Reply, compose, and manage drafts in one place" },
  { icon: RiSparkling2Fill, text: "AI that reads and summarizes your inbox for you" },
  { icon: RiShieldCheckLine, text: "Credentials encrypted — Tsunagu never stores plain text tokens" },
];

export default function ConnectGmail() {
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
          <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-border/60 text-foreground">Step 2</span>
          <span className="text-border/60">·</span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/30 text-muted-foreground/35">Step 3</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-md mx-auto gap-7">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 font-heading animate-in fade-in duration-300">
          <RiGoogleFill className="size-3" />
          Connect Gmail
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-serif tracking-tight leading-[1.05] text-foreground animate-in fade-in slide-in-from-bottom-4 duration-400">
          Your inbox,<br />
          <span className="italic text-muted-foreground">intelligently managed.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-88 animate-in fade-in duration-500 delay-75">
          Grant Gmail access so Tsunagu can read, organize, and help you respond to your emails faster.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[260px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Button
            className="w-full gap-2 h-11 px-6 font-semibold text-sm rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            onClick={() => { window.location.href = "/api/connect?plugin=gmail"; }}
          >
            <RiGoogleFill className="size-4" />
            Connect Gmail with Google
          </Button>
          <p className="text-[10px] text-muted-foreground/35 font-medium tracking-wide">
            Encrypted OAuth · Read &amp; send scope only
          </p>
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
          Your tokens are encrypted at rest. Tsunagu never reads your email on behalf of anyone but you.
        </p>
      </footer>
    </div>
  );
}
