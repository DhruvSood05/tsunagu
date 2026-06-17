"use client";

import { authClient } from "@/lib/auth-client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme/ThemeProvider";
import Link from "next/link";
import TsunaguLogo from "@/components/ui/TsunaguLogo";
import {
  ArrowRight,
  Mail,
  Calendar,
  Sparkles,
  Search,
  Keyboard,
  Inbox,
  CalendarDays,
  Send,
  Sun,
  Moon,
} from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// ─── Japanese Ink — warm muted avatars (no rainbow AI pastels) ───────────────
const AV_A = "bg-foreground/[0.06] text-foreground/75 border border-border/50";
const AV_B = "bg-foreground/[0.09] text-foreground/80 border border-border/60";
const AV_C = "bg-secondary text-muted-foreground border border-border/40";
const AV_D = "bg-foreground/[0.04] text-foreground/65 border border-border/40";
const AV_NEUTRAL = "bg-secondary text-muted-foreground border border-border/40";

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({
  phrases,
  className,
  caretClassName,
  typingSpeed = 55,
  deletingSpeed = 28,
  pauseMs = 1700,
}: {
  phrases: string[];
  className?: string;
  caretClassName?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && sub === current) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && sub === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(
        () => setSub((prev) => current.slice(0, deleting ? prev.length - 1 : prev.length + 1)),
        deleting ? deletingSpeed : typingSpeed
      );
    }
    return () => clearTimeout(timeout);
  }, [sub, deleting, index, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className}>
      {sub}
      <span className={`animate-caret font-normal ${caretClassName ?? ""}`}>|</span>
    </span>
  );
}

// ─── Interactive Product UI Fragments ─────────────────────────────────────────

function DashboardMockup() {
  const [activeRow, setActiveRow] = useState(0);

  const emails = [
    { from: "Sarah Chen",  subj: "Q3 investor update deck",  av: "SC", c: AV_A,  time: "9:41 AM",   addr: "sarah@acme.com",     unread: true,  body: ["Hi — attached are the revised slides with updated financial projections and the go-to-market narrative. Key changes on slides 8 and 12 address the concerns raised last quarter.", "Let me know if you want to hop on a call before Thursday's board presentation. I'm free 2–4 PM."] },
    { from: "Marcus Reed", subj: "Re: Partnership proposal", av: "MR", c: AV_B, time: "8:15 AM",   addr: "marcus@ventures.co", unread: true,  body: ["Thanks for sending the proposal. The terms look reasonable overall.", "Two things worth discussing: the exclusivity clause and the revenue share model. Are you free this week?"] },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",     av: "AK", c: AV_C,  time: "Yesterday", addr: "alex@studio.io",     unread: false, body: ["Do you have 20 minutes to sync tomorrow? I want to walk through the updated design before we present to the client.", "Happy to jump on a call around 2 PM if that works."] },
    { from: "Design team", subj: "Figma comments on v3",    av: "DT", c: AV_D,    time: "Mon",       addr: "design@company.io",  unread: false, body: ["Left a few comments on the v3 mockups in Figma. Nothing major — mostly spacing adjustments on the dashboard header.", "Let me know when you're ready to review."] },
  ];

  const active = emails[activeRow];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.28)] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.70)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-secondary/60">
        <div className="size-3 rounded-full bg-red-400/60" />
        <div className="size-3 rounded-full bg-amber-400/60" />
        <div className="size-3 rounded-full bg-emerald-400/60" />
        <div className="flex-1 mx-4 h-5 rounded-md bg-background border border-border/60 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/50 font-mono tracking-tight">app.tsunagu.ai/dashboard</span>
        </div>
      </div>

      <div className="flex" style={{ height: 520 }}>
        {/* Sidebar */}
        <div className="w-44 border-r border-border flex flex-col p-3 gap-1 bg-secondary/40 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2.5 mb-2">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-[10px] font-bold leading-none">T</span>
            </div>
            <span className="text-[12px] font-bold tracking-wider text-foreground font-heading">TSUNAGU</span>
          </div>
          {[
            { label: "Inbox", badge: "4" },
            { label: "Sent", badge: null },
            { label: "Drafts", badge: "2" },
            { label: "Calendar", badge: null },
          ].map((item, i) => (
            <div key={item.label} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[12px] font-medium ${i === 0 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/70 hover:text-foreground"}`}>
              <span>{item.label}</span>
              {item.badge && <span className="text-[10px] font-mono bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-border">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-ai-muted border border-ai">
              <Sparkles className="size-3.5 text-ai shrink-0" strokeWidth={1.75} />
              <span className="text-[12px] font-medium text-ai">AI Assistant</span>
            </div>
          </div>
        </div>

        {/* Email list */}
        <div className="w-56 border-r border-border flex flex-col bg-background shrink-0">
          <div className="px-3.5 py-3 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70">Inbox</span>
            <span className="text-[11px] font-mono bg-secondary text-muted-foreground/60 px-2 py-0.5 rounded-full">{emails.length}</span>
          </div>
          <div className="flex-1 overflow-hidden divide-y divide-border">
            {emails.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveRow(i)}
                className={`w-full text-left flex items-center gap-3 px-3.5 py-3 transition-colors cursor-pointer ${i === activeRow ? "bg-secondary" : "hover:bg-secondary/50"}`}
              >
                <div className={`size-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${e.c}`}>{e.av}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] truncate ${e.unread && i !== activeRow ? "font-semibold text-foreground" : "text-muted-foreground/80"}`}>{e.from}</p>
                  <p className={`text-[11px] truncate mt-0.5 ${e.unread && i !== activeRow ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{e.subj}</p>
                </div>
                {e.unread && i !== activeRow && <div className="size-2 rounded-full bg-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Email detail */}
        <div className="flex-1 flex flex-col min-w-0 bg-card">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 mb-2.5">
              <div className={`size-9 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${active.c}`}>{active.av}</div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{active.from}</p>
                <p className="text-[11px] text-muted-foreground/70">{active.addr} · {active.time}</p>
              </div>
            </div>
            <p className="text-[13px] font-semibold text-foreground">{active.subj}</p>
          </div>
          <div className="flex-1 px-6 py-5 overflow-hidden">
            {active.body.map((para, i) => (
              <p key={i} className={`text-[12px] leading-relaxed ${i === 0 ? "text-foreground/80 mb-4" : "text-muted-foreground/70"}`}>{para}</p>
            ))}
          </div>
          <div className="px-6 py-3.5 border-t border-border shrink-0">
            <div className="flex items-center gap-2.5 bg-ai-muted border border-ai rounded-xl px-4 py-3">
              <Sparkles className="size-4 text-ai shrink-0" strokeWidth={1.75} />
              <Typewriter
                phrases={["Draft a reply with AI…", "Summarize this thread…", "Schedule a follow-up…"]}
                className="text-[12px] text-ai/90"
                caretClassName="text-ai"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailListMockup() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const emails = [
    { from: "Sarah Chen",  subj: "Q3 investor update deck",  snippet: "I have attached the revised slides...",  time: "9:41 AM",   unread: true,  c: AV_A },
    { from: "Marcus Reed", subj: "Re: Partnership proposal", snippet: "Thanks for sending this over...",          time: "8:15 AM",   unread: true,  c: AV_B },
    { from: "Notion",      subj: "Your workspace summary",   snippet: "Here are highlights from this week...",   time: "Yesterday", unread: false, c: AV_NEUTRAL },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",     snippet: "Hey, do you have 20 minutes to...",       time: "Yesterday", unread: false, c: AV_C },
    { from: "GitHub",      subj: "New security advisory",    snippet: "A vulnerability has been reported...",    time: "Mon",       unread: false, c: AV_NEUTRAL },
  ];

  const handleClick = (i: number) => {
    setSelectedId(i);
    setReadIds((prev) => new Set([...prev, i]));
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.22)] dark:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.60)]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Inbox</span>
          <span className="text-[9px] font-mono bg-secondary text-muted-foreground/70 px-1.5 py-0.5 rounded">{emails.length}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {["Primary", "Updates", "Other"].map((t, i) => (
            <span key={t} className={`text-[9px] px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"}`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {emails.map((e, i) => {
          const isRead = readIds.has(i) || !e.unread;
          const isSelected = selectedId === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(i)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer ${isSelected ? "bg-secondary" : "hover:bg-secondary/50"}`}
            >
              <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${e.c}`}>{e.from[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className={`text-xs truncate ${!isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{e.from}</span>
                  <span className="text-[10px] text-muted-foreground/50 shrink-0 font-mono">{e.time}</span>
                </div>
                <p className={`text-[11px] truncate ${!isRead ? "font-medium text-foreground/80" : "text-muted-foreground/60"}`}>{e.subj}</p>
                <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{e.snippet}</p>
              </div>
              {!isRead && <div className="size-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AIDraftMockup() {
  const [draftIdx, setDraftIdx] = useState(0);
  const [sent, setSent] = useState(false);

  const drafts = [
    {
      greeting: "Hi Sarah,",
      paragraphs: [
        "Thank you for sharing the revised deck. The narrative arc is much cleaner in this version. Before Thursday's board presentation, I have a few thoughts on slides 8 and 12 worth discussing.",
        "Would you have 20 minutes on Wednesday afternoon? I am free from 2 to 4 PM.",
      ],
    },
    {
      greeting: "Sarah,",
      paragraphs: [
        "The deck looks great. Slides 8 and 12 are much stronger now — the financial projections read clearly and the go-to-market framing is sharper.",
        "Can we connect briefly before Thursday? I want to make sure we are aligned on the messaging before the board sees it.",
      ],
    },
    {
      greeting: "Hi Sarah,",
      paragraphs: [
        "Quick note to say the revised slides are a big improvement. The changes on 8 and 12 address exactly what came up last quarter.",
        "Are you free for a 20-minute call on Wednesday? I am available from 2 to 4 PM.",
      ],
    },
  ];

  const current = drafts[draftIdx];

  const handleRegenerate = () => setDraftIdx((p) => (p + 1) % drafts.length);
  const handleSend = () => { setSent(true); setTimeout(() => setSent(false), 2200); };

  if (sent) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_30px_70px_-30px_rgba(0,0,0,0.22)] dark:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.60)]" style={{ minHeight: 268 }}>
        <div className="text-center py-10">
          <div className="size-10 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3">
            <Send className="size-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-foreground/80">Message sent</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Delivered via Gmail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.22)] dark:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.60)]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">New Message</span>
        <span className="text-[10px] text-ai bg-ai-muted border border-ai px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5">
          <Sparkles className="size-2.5" strokeWidth={1.75} />
          AI Draft{draftIdx > 0 ? ` v${draftIdx + 1}` : ""}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 py-1.5 border-b border-border">
          <span className="text-[10px] text-muted-foreground/60 w-8 shrink-0">To</span>
          <span className="text-[11px] text-foreground/80">sarah@acme.com</span>
        </div>
        <div className="flex items-center gap-3 py-1.5 border-b border-border">
          <span className="text-[10px] text-muted-foreground/60 w-8 shrink-0">Sub</span>
          <span className="text-[11px] text-foreground/80">Re: Q3 investor update deck</span>
        </div>
        <div className="pt-1 space-y-2">
          <p className="text-[11px] text-foreground/75 leading-relaxed">{current.greeting}</p>
          {current.paragraphs.map((para, i) => (
            <p key={i} className="text-[11px] text-foreground/75 leading-relaxed">{para}</p>
          ))}
        </div>
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground/60">Generated from thread context</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleRegenerate} className="text-[10px] text-muted-foreground px-2 py-1 rounded border border-border hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer">
              Regenerate
            </button>
            <button type="button" onClick={handleSend} className="text-[10px] bg-primary text-primary-foreground font-semibold px-3 py-1 rounded hover:bg-primary/90 transition-colors cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const [selectedEvIdx, setSelectedEvIdx] = useState<number | null>(null);

  const days = ["Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"];
  const times = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"];
  const events = [
    { day: 0, start: 1, len: 1, title: "1:1 Sarah",     c: "bg-foreground/[0.06] border-border text-foreground/80", time: "10:00 AM", info: "Zoom · 30 min" },
    { day: 1, start: 0, len: 2, title: "Investor call", c: "bg-primary/10 border-primary/25 text-foreground/85",        time: "9:00 AM",  info: "Google Meet · Marcus Reed" },
    { day: 2, start: 2, len: 1, title: "Design review", c: "bg-foreground/[0.05] border-border text-foreground/75", time: "11:00 AM", info: "With design team" },
    { day: 3, start: 3, len: 1, title: "Standup",       c: "bg-foreground/[0.04] border-border text-foreground/70", time: "12:00 PM", info: "Daily sync" },
    { day: 4, start: 0, len: 3, title: "All-hands",     c: "bg-foreground/[0.07] border-border text-foreground/80",        time: "9:00 AM",  info: "Main conference room" },
  ];

  const sel = selectedEvIdx !== null ? events[selectedEvIdx] : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.22)] dark:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.60)]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/60">‹</span>
          <span className="text-[10px] font-bold text-foreground/75">June 2026</span>
          <span className="text-[9px] text-muted-foreground/60">›</span>
        </div>
        <div className="flex items-center gap-0.5">
          {["Day", "Week", "Month"].map((v, i) => (
            <span key={v} className={`text-[9px] px-2 py-0.5 rounded font-medium ${i === 1 ? "bg-secondary text-foreground" : "text-muted-foreground/50"}`}>{v}</span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-1.5 mb-2">
          <div className="w-10 shrink-0" />
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {days.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/70 pb-1">{d}</div>)}
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-10 shrink-0 space-y-[18px] pt-1">
            {times.map((t) => <div key={t} className="text-[9px] text-muted-foreground/50 text-right leading-none font-mono">{t}</div>)}
          </div>
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {days.map((_, di) => (
              <div key={di} className="relative">
                {times.map((_, ti) => {
                  const evIdx = events.findIndex((e) => e.day === di && e.start === ti);
                  const ev = evIdx >= 0 ? events[evIdx] : null;
                  return (
                    <div key={ti} className="h-8 border-t border-border relative">
                      {ev && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvIdx(selectedEvIdx === evIdx ? null : evIdx)}
                          className={`absolute inset-x-0 top-0 w-full text-left rounded-md px-1.5 py-1 border text-[9px] font-semibold overflow-hidden z-10 cursor-pointer transition-all ${ev.c} ${selectedEvIdx === evIdx ? "ring-1 ring-foreground/20 brightness-95" : "hover:brightness-105"}`}
                          style={{ height: `${ev.len * 32 - 2}px` }}
                        >
                          {ev.title}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {sel && (
          <div className="mt-3 border-t border-border pt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-foreground/80">{sel.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{days[sel.day]} · {sel.time}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sel.info}</p>
            </div>
            <button type="button" onClick={() => setSelectedEvIdx(null)} className="text-[11px] text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors shrink-0">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommandPaletteMockup() {
  const [query, setQuery] = useState("investor update");
  const [activeIdx, setActiveIdx] = useState(0);

  const emailData = [
    { from: "Sarah Chen",  subj: "Q3 investor update deck",      time: "9:41 AM",   c: AV_A },
    { from: "Marcus Reed", subj: "Investor partnership proposal", time: "Mon",       c: AV_B },
    { from: "Notion",      subj: "Your workspace summary",        time: "Yesterday", c: AV_NEUTRAL },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",          time: "Yesterday", c: AV_C },
    { from: "GitHub",      subj: "New security advisory",         time: "Mon",       c: AV_NEUTRAL },
  ];

  const calData = [
    { title: "Investor call",      date: "Tue 17 Jun · 10:00 AM" },
    { title: "Board presentation", date: "Thu 19 Jun · 2:00 PM"  },
    { title: "1:1 Sarah Chen",     date: "Mon 16 Jun · 11:00 AM" },
    { title: "Design review",      date: "Wed 18 Jun · 11:00 AM" },
  ];

  const q = query.toLowerCase().trim();
  const filteredEmails = q
    ? emailData.filter((e) => e.from.toLowerCase().includes(q) || e.subj.toLowerCase().includes(q))
    : emailData.slice(0, 3);
  const filteredCal = q
    ? calData.filter((e) => e.title.toLowerCase().includes(q))
    : calData.slice(0, 2);
  const total = filteredEmails.length + filteredCal.length;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_40px_100px_-30px_rgba(0,0,0,0.32)] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.72)] max-w-xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <Search className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          placeholder="Search emails and calendar..."
          className="text-sm text-foreground/80 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50 caret-primary"
        />
        <kbd className="text-[9px] font-mono text-muted-foreground/60 bg-secondary border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
      <div className="py-1">
        {filteredEmails.length > 0 && (
          <div>
            <div className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 flex items-center gap-1.5">
              <Mail className="size-2.5" strokeWidth={1.75} /> Emails
            </div>
            {filteredEmails.map((r, i) => {
              const isActive = i === activeIdx;
              return (
                <button key={i} type="button" onMouseEnter={() => setActiveIdx(i)} className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                  <div className={`size-7 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${r.c}`}>{r.from[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 font-medium truncate">{r.subj}</p>
                    <p className="text-[10px] text-muted-foreground">{r.from}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">{r.time}</span>
                  {isActive && <kbd className="size-5 rounded border border-border font-mono text-[8px] text-muted-foreground/60 flex items-center justify-center shrink-0">↵</kbd>}
                </button>
              );
            })}
          </div>
        )}
        {filteredCal.length > 0 && (
          <div>
            <div className={`px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 flex items-center gap-1.5 ${filteredEmails.length > 0 ? "border-t border-border mt-1" : ""}`}>
              <Calendar className="size-2.5" strokeWidth={1.75} /> Calendar
            </div>
            {filteredCal.map((ev, i) => {
              const flatIdx = filteredEmails.length + i;
              const isActive = flatIdx === activeIdx;
              return (
                <button key={i} type="button" onMouseEnter={() => setActiveIdx(flatIdx)} className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                  <div className="size-7 rounded-full bg-primary/12 text-ai flex items-center justify-center shrink-0">
                    <CalendarDays className="size-3.5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 font-medium">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.date}</p>
                  </div>
                  {isActive && <kbd className="size-5 rounded border border-border font-mono text-[8px] text-muted-foreground/60 flex items-center justify-center shrink-0">↵</kbd>}
                </button>
              );
            })}
          </div>
        )}
        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 select-none">
            <p className="text-sm font-semibold text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-[11px] text-muted-foreground/50">Try a different keyword</p>
          </div>
        )}
        <div className="border-t border-border px-4 py-2 flex items-center gap-5 mt-1">
          {[["↑↓", "Navigate"], ["↵", "Open"], ["Esc", "Close"]].map(([k, l]) => (
            <div key={k} className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60">
              <kbd className="font-mono bg-secondary border border-border px-1 py-0.5 rounded text-[8px] text-muted-foreground">{k}</kbd>
              {l}
            </div>
          ))}
          {total > 0 && <div className="ml-auto text-[10px] text-muted-foreground/50 font-mono">{total} result{total !== 1 ? "s" : ""}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function NavThemeToggle({ scrolled }: { scrolled: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const size = scrolled ? "size-7" : "size-8";

  if (!mounted) {
    return <div className={`${size} rounded-full bg-secondary/50 shrink-0 transition-all duration-300`} />;
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`${size} flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 active:scale-90 cursor-pointer shrink-0`}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      )}
    </button>
  );
}

function Nav({ onSignIn }: { onSignIn: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ease-out ${
        scrolled ? "pt-2" : "pt-4"
      }`}
    >
      <nav
        className={`flex items-center justify-between gap-3 w-full rounded-full border border-border backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-500 transition-[max-width,padding,background-color,box-shadow] ease-out ${
          scrolled
            ? "max-w-3xl px-3 py-1.5 bg-card/85 shadow-[0_10px_34px_-14px_rgba(33,30,26,0.30)]"
            : "max-w-5xl px-5 py-2.5 bg-card/65 shadow-[0_6px_24px_-14px_rgba(33,30,26,0.18)]"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0">
          <TsunaguLogo className={`text-primary transition-all duration-300 ${scrolled ? "size-6" : "size-8"}`} />
          <span className="font-semibold text-base tracking-tight text-foreground font-display">Tsunagu</span>
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {[
            { id: "features", label: "Features" },
            { id: "product", label: "Product" },
            { id: "pricing", label: "Pricing" },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <NavThemeToggle scrolled={scrolled} />
          <button
            type="button"
            onClick={onSignIn}
            className={`flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer shrink-0 ${
              scrolled ? "text-[13px] px-3.5 py-1.5" : "text-sm px-4 py-2"
            }`}
          >
            Get started
            <ArrowRight className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </nav>
    </div>
  );
}

// ─── Section 1: Hero ──────────────────────────────────────────────────────────

function Hero({ onSignIn, error }: { onSignIn: () => void; error: string | null }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-0 px-6 overflow-hidden bg-background">
      {/* Premium animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="absolute top-[-12%] left-[18%] w-[540px] h-[540px] rounded-full bg-primary/10 blur-[130px] animate-[drift-1_19s_ease-in-out_infinite]" />
        <div className="absolute top-[6%] right-[12%] w-[480px] h-[480px] rounded-full bg-primary/6 blur-[140px] animate-[drift-2_23s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-14%] left-[38%] w-[500px] h-[500px] rounded-full bg-foreground/[0.03] blur-[130px] animate-[drift-3_27s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Animated badge */}
        <div className="hero-line hero-d0 inline-flex items-center gap-2.5 mb-8 pl-1 pr-4 py-1 rounded-full border border-primary/20 bg-primary/8 backdrop-blur-sm shadow-sm">
          <span className="flex items-center justify-center size-5 rounded-full bg-primary/15 border border-primary/25 shrink-0">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/70 animate-ping" />
              <span className="relative inline-flex rounded-full size-1.5 bg-primary" />
            </span>
          </span>
          <span className="inline-block min-w-[188px] text-left text-[12.5px] font-semibold text-primary/80 font-heading">
            <Typewriter
              phrases={["Draft replies with AI", "Schedule meetings naturally", "Search your inbox instantly"]}
              caretClassName="text-primary"
            />
          </span>
        </div>

        <h1 className="hero-line hero-d1 font-display font-bold text-foreground tracking-tight leading-[1.05] text-5xl sm:text-6xl lg:text-[72px] xl:text-[80px] mb-6">
          Your AI agent for<br />
          <span className="text-primary">email and calendar.</span>
        </h1>

        <p className="hero-line hero-d2 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed mb-8">
          Tsunagu connects Gmail and Google Calendar through an AI agent that drafts, schedules, and triages — and always waits for your approval before acting.
        </p>

        {error && (
          <div className="mb-6 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive max-w-sm">
            Authentication failed. Please try again.
          </div>
        )}

        <div className="hero-line hero-d3 flex flex-col sm:flex-row items-center gap-3 mb-6">
          {/* Primary CTA with shimmer sweep */}
          <button
            type="button"
            onClick={onSignIn}
            className="relative overflow-hidden flex items-center gap-2.5 bg-primary text-primary-foreground font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            {/* Shimmer highlight */}
            <span className="animate-shimmer pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <GoogleIcon className="size-4 relative z-10" />
            <span className="relative z-10">Get started free</span>
          </button>
          <a href="#product" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border px-7 py-3.5 rounded-xl hover:bg-secondary/60 transition-all cursor-pointer">
            See how it works
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </a>
        </div>
        <p className="hero-line hero-d4 text-[11px] text-muted-foreground/60 font-medium">No credit card · No setup · Works with your existing Gmail</p>

        {/* Tech trust badges */}
        <div className="hero-line hero-d5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8">
          {["Corsair MCP", "OpenAI Agents", "Real-time Webhooks", "OAuth 2.0"].map((badge) => (
            <span key={badge} className="text-[10px] font-semibold font-heading uppercase tracking-widest text-muted-foreground/50">{badge}</span>
          ))}
        </div>
      </div>

      {/* Mockup — floats gently */}
      <div className="hero-line hero-d6 relative z-10 w-full max-w-5xl mx-auto mt-16 px-4 animate-float">
        <DashboardMockup />
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

// ─── Section 2: Trust Band ───────────────────────────────────────────────────

function TrustBand() {
  const roles = ["Founders", "Operators", "Recruiters", "Executives", "Consultants", "Freelancers"];
  return (
    <section className="bg-background border-y border-border py-7 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 font-heading shrink-0">Built for</span>
        <div className="hidden sm:block w-px h-4 bg-border shrink-0" />
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-2.5">
          {roles.map((role) => (
            <span key={role} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default">{role}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: How It Works ─────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect in one click",        desc: "Sign in with Google. Tsunagu connects Gmail and Google Calendar immediately. No migration, no configuration, no setup guides." },
    { n: "02", title: "Everything in one place",     desc: "Your inbox and calendar live side by side in a focused reading pane. Smart category tabs. Full conversation context. Nothing buried." },
    { n: "03", title: "Move faster with AI",         desc: "Ask the AI to draft a reply, schedule a meeting, or triage your inbox. From the chat panel or the command palette, in plain language." },
  ];
  return (
    <section className="bg-background border-t border-border py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-lg">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 font-heading mb-5">How it works</p>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight">
            Set up in a minute. Use for years.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} className={`py-10 sm:py-0 ${i === 0 ? "sm:pr-10" : i === steps.length - 1 ? "sm:pl-10" : "sm:px-10"}`}>
              <p className="text-[11px] font-bold font-mono text-muted-foreground/40 mb-7 tracking-widest">{n}</p>
              <h3 className="font-sans font-bold text-foreground text-xl mb-3 tracking-tight leading-snug">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: Feature Inbox ────────────────────────────────────────────────

function FeatureInbox() {
  return (
    <section id="features" className="bg-secondary/30 dark:bg-white/[0.022] py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-heading">
            <Inbox className="size-3" strokeWidth={1.75} />
            Unified Inbox
          </div>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
            Your inbox, the way it should have always worked.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            Tsunagu pulls Gmail into a focused reading pane with smart category tabs, real-time previews, and bulk actions. Every message visible. Nothing buried three clicks deep.
          </p>
          <ul className="space-y-3">
            {["Primary, Updates, and Promotions tabs built in", "Bulk select and delete in one keystroke", "Full-text search across your entire inbox history", "Threaded conversation view with complete context"].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="size-1 rounded-full bg-muted-foreground/50 shrink-0 mt-[7px]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div><EmailListMockup /></div>
      </div>
    </section>
  );
}

// ─── Section 5: Feature AI ───────────────────────────────────────────────────

function FeatureAI() {
  return (
    <section className="bg-background py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="order-2 lg:order-1"><AIDraftMockup /></div>
        <div className="order-1 lg:order-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-ai font-heading">
            <Sparkles className="size-3 text-ai" strokeWidth={1.75} />
            AI Drafting
          </div>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
            Write the right reply in seconds, not minutes.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            The AI reads the thread, understands context, and drafts a response in your voice. Hit Regenerate to try a different angle. Hit Send to deliver it through your real Gmail address.
          </p>
          <ul className="space-y-3">
            {["Contextual drafts based on full thread history", "One-click regenerate for a different tone or angle", "Sends through your real Gmail address", "Replies that sound like you, not like software"].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="size-1 rounded-full bg-primary/50 shrink-0 mt-[7px]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Section 6: Command Palette ──────────────────────────────────────────────

function CommandPaletteSpot() {
  return (
    <section id="product" className="bg-secondary/30 dark:bg-white/[0.022] py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-heading">
            <Keyboard className="size-3" strokeWidth={1.75} />
            Command Palette
          </div>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-5">
            Everything, one keystroke away.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Press{" "}
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary border border-border text-[11px] font-mono text-foreground/70">⌘K</kbd>
            {" "}from anywhere to search emails and calendar events simultaneously. Type to filter. Arrow keys to navigate. Enter to open.
          </p>
        </div>
        <CommandPaletteMockup />
        <div className="mt-10 flex items-center justify-center gap-10 flex-wrap">
          {[["⌘K", "Open"], ["↑↓", "Navigate"], ["↵", "Open result"], ["Esc", "Close"]].map(([k, l]) => (
            <div key={k} className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <kbd className="px-2 py-1 rounded bg-secondary border border-border font-mono text-[10px] text-muted-foreground">{k}</kbd>
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 7: Feature Calendar ─────────────────────────────────────────────

function FeatureCalendar() {
  return (
    <section className="bg-background py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-heading">
            <Calendar className="size-3" strokeWidth={1.75} />
            Calendar
          </div>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
            Schedule without leaving your inbox.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            Google Calendar sits alongside your inbox. See the week, create events, manage invites, and schedule follow-ups without opening a second tab. Click any event to see details.
          </p>
          <ul className="space-y-3">
            {["Week, day, and month views alongside email", "Per-calendar color coding across multiple accounts", "Natural language event creation via the AI assistant", "Meeting invites sent directly through Google"].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="size-1 rounded-full bg-muted-foreground/50 shrink-0 mt-[7px]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div><CalendarMockup /></div>
      </div>
    </section>
  );
}

// ─── Spotlight card (Aceternity-style, warm-recolored, no deps) ───────────────

function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden ${className ?? ""}`}
    >
      {/* cursor-following glow — scarce violet accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx) var(--my), color-mix(in oklab, var(--primary) 12%, transparent), transparent 72%)",
        }}
      />
      {children}
    </div>
  );
}

// ─── Section 8: Feature Grid — animated demo cards ────────────────────────────

function SearchFeature() {
  const queries = ["investor update", "board prep", "Sarah deck"];
  const results = [
    { from: "Sarah Chen",  subj: "Q3 investor update deck",     time: "9:41 AM", c: AV_A  },
    { from: "Marcus Reed", subj: "Investor partnership brief",  time: "Mon",     c: AV_B },
    { from: "Alex Kim",    subj: "Board meeting agenda",        time: "Tue",     c: AV_C  },
  ];
  const [qIdx, setQIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const q = queries[qIdx];
    setTyped(""); setShown(0);
    let i = 0;
    const tick = () => {
      i++;
      setTyped(q.slice(0, i));
      if (i < q.length) { t = setTimeout(tick, 55); return; }
      let r = 0;
      const show = () => {
        r++; setShown(r);
        if (r < results.length) t = setTimeout(show, 180);
        else t = setTimeout(() => setQIdx(p => (p + 1) % queries.length), 2400);
      };
      t = setTimeout(show, 380);
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2"><Search className="size-3" strokeWidth={1.75} />Semantic Search</p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">Find anything, instantly.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Plain-language search across your full inbox history.</p>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <Search className="size-3.5 text-muted-foreground/40 shrink-0" strokeWidth={1.75} />
          <span className="text-sm text-foreground/80 font-mono flex-1">
            {typed}<span className="inline-block w-px h-3.5 bg-foreground/50 ml-px align-middle animate-caret" />
          </span>
          <kbd className="text-[9px] font-mono bg-secondary border border-border px-1.5 py-0.5 rounded text-muted-foreground">⌘K</kbd>
        </div>
        <div className="divide-y divide-border">
          {shown === 0
            ? <div className="px-4 py-5 text-center text-[11px] text-muted-foreground/40">Searching…</div>
            : results.slice(0, shown).map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${r.c}`}>{r.from[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80 truncate">{r.subj}</p>
                  <p className="text-[10px] text-muted-foreground">{r.from}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">{r.time}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function WebhookFeature() {
  const base = [
    { from: "Notion",      subj: "Your workspace summary",    time: "Yesterday", c: AV_NEUTRAL, unread: false },
    { from: "GitHub",      subj: "New security advisory",     time: "Mon",       c: AV_NEUTRAL, unread: false },
  ];
  const wave = [
    { from: "Sarah Chen",  subj: "Just sent the revised deck", time: "Now",  c: AV_A  },
    { from: "Marcus Reed", subj: "Can we move tomorrow's call?",time: "Now",  c: AV_B },
    { from: "Alex Kim",    subj: "Quick question on the deck", time: "Now",  c: AV_C  },
  ];
  const [top, setTop] = useState<typeof wave[number] | null>(null);
  const [wIdx, setWIdx] = useState(0);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => {
        setTop(wave[wIdx % wave.length]);
        setWIdx(i => i + 1);
        setPulse(false);
      }, 500);
    }, 2800);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wIdx]);

  const rows = top ? [{ ...top, unread: true }, ...base] : base;

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2">
          <span className="relative flex size-1.5">
            <span className={`absolute inset-0 rounded-full bg-primary transition-opacity ${pulse ? "animate-ping" : ""}`} />
            <span className="relative rounded-full size-1.5 bg-primary" />
          </span>
          Live Webhook Sync
        </p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">Email arrives in real time.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Corsair push — no polling, no refresh button.</p>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
        {rows.map((e, i) => (
          <div key={`${e.from}-${i}`} className={`flex items-center gap-3 px-4 py-3 ${i === 0 && e.unread ? "animate-in slide-in-from-top-2 fade-in duration-300" : ""}`}>
            <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${e.c}`}>{e.from[0]}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs truncate ${e.unread ? "font-semibold text-foreground" : "text-muted-foreground/70"}`}>{e.subj}</p>
              <p className="text-[10px] text-muted-foreground">{e.from}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-muted-foreground/50 font-mono">{e.time}</span>
              {e.unread && <div className="size-1.5 rounded-full bg-primary" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyboardFeature() {
  const shortcuts = [
    { keys: ["⌘", "K"],      label: "Open command palette",  icon: Search       },
    { keys: ["G", "I"],      label: "Go to inbox",            icon: Mail          },
    { keys: ["C"],           label: "Compose new email",      icon: Send     },
    { keys: ["⌘", "↵"],     label: "Send email",             icon: Send     },
    { keys: ["E"],           label: "Archive selected",       icon: Inbox         },
    { keys: ["?"],           label: "Show all shortcuts",     icon: Keyboard      },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % shortcuts.length), 1300);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2"><Keyboard className="size-3" strokeWidth={1.75} />Keyboard-first UX</p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">Zero mouse required.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Every action, one keystroke away.</p>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden divide-y divide-border">
        {shortcuts.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-300 ${i === active ? "bg-secondary" : ""}`}>
              <Icon className={`size-3.5 shrink-0 transition-colors duration-300 ${i === active ? "text-ai" : "text-muted-foreground/30"}`} strokeWidth={1.75} />
              <span className={`text-xs flex-1 transition-colors duration-300 ${i === active ? "text-foreground font-medium" : "text-muted-foreground/60"}`}>{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all duration-300 ${i === active ? "bg-ai-muted border-ai text-ai" : "bg-secondary border-border text-muted-foreground"}`}>{k}</kbd>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZeroTrustFeature() {
  const draftText = "Hi Sarah,\n\nThank you for the revised deck — the Q3 narrative is much cleaner. Before Thursday's board meeting I'd love to walk through slides 8 and 12.\n\nAre you free Wednesday 2–4 PM?";
  const [phase, setPhase] = useState<"typing" | "review" | "sent">("typing");
  const [typed, setTyped] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (charIdx < draftText.length) {
        t = setTimeout(() => { setTyped(draftText.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }, 16);
      } else {
        t = setTimeout(() => setPhase("review"), 700);
      }
    } else if (phase === "sent") {
      t = setTimeout(() => { setPhase("typing"); setTyped(""); setCharIdx(0); }, 2000);
    }
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, charIdx]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2"><Sparkles className="size-3 text-ai" strokeWidth={1.75} />Zero-trust Drafts</p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">AI writes. You decide.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Nothing sends without your explicit click.</p>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between shrink-0">
          <span className="text-[10px] text-muted-foreground/60">To: sarah@acme.com · Re: Q3 deck</span>
          <span className="text-[10px] text-ai bg-primary/10 dark:bg-primary/15 border border-ai dark:border-ai px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="size-2.5" strokeWidth={1.75} />AI Draft
          </span>
        </div>
        <div className="px-4 py-3 min-h-[100px] flex-1">
          {phase === "sent" ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-4">
              <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <Send className="size-4 text-emerald-600" strokeWidth={1.75} />
              </div>
              <p className="text-xs font-medium text-foreground/70">Sent via Gmail</p>
            </div>
          ) : (
            <p className="text-[11px] text-foreground/75 leading-relaxed whitespace-pre-wrap font-mono">
              {typed}{phase === "typing" && <span className="inline-block w-px h-3 bg-foreground/50 ml-px align-middle animate-caret" />}
            </p>
          )}
        </div>
        {phase === "review" && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[10px] text-muted-foreground/60">Review before sending</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPhase("typing"); setTyped(""); setCharIdx(0); }} className="text-[10px] text-muted-foreground px-2.5 py-1.5 rounded border border-border hover:border-foreground/20 cursor-pointer transition-colors">Regenerate</button>
              <button type="button" onClick={() => setPhase("sent")} className="text-[10px] bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded cursor-pointer hover:bg-primary/90 transition-colors">Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarFeature() {
  const [chatVisible, setChatVisible] = useState(false);
  const [eventVisible, setEventVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    const run = () => {
      setChatVisible(false); setEventVisible(false); setConfirmVisible(false);
      const t1 = setTimeout(() => setChatVisible(true), 500);
      const t2 = setTimeout(() => setEventVisible(true), 1300);
      const t3 = setTimeout(() => setConfirmVisible(true), 2100);
      const t4 = setTimeout(run, 4500);
      return [t1, t2, t3, t4];
    };
    const ts = run();
    return () => ts.forEach(clearTimeout);
  }, []);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2"><CalendarDays className="size-3" strokeWidth={1.75} />Calendar Orchestration</p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">Schedule in plain English.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">Describe it, AI finds the slot, you confirm.</p>
      </div>
      <div className="bg-background border border-border rounded-xl overflow-hidden flex flex-col divide-y divide-border">
        {chatVisible && (
          <div className="px-4 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="size-6 rounded-full bg-primary/10 border border-ai flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="size-3 text-ai" strokeWidth={1.75} />
            </div>
            <div className="bg-secondary rounded-xl px-3 py-2">
              <p className="text-[11px] text-foreground/80">Found a slot — Wed Jun 18, 2:00 PM. Scheduling 30-min call with Sarah.</p>
            </div>
          </div>
        )}
        <div className="p-3">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {days.map((d) => <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground/60 pb-1">{d}</div>)}
            {days.map((_, di) => (
              <div key={di} className="h-14 border border-border rounded-lg relative overflow-hidden bg-background">
                {di === 2 && eventVisible && (
                  <div className="absolute inset-1 rounded bg-primary/15 border border-ai flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-300">
                    <p className="text-[8px] font-bold text-ai leading-tight text-center">Call w/ Sarah</p>
                    <p className="text-[7px] text-muted-foreground/70">2:00 PM</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {confirmVisible && (
          <div className="px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-[10px] text-muted-foreground/60">Wed Jun 18 · 2:00 PM · 30 min</span>
            <button type="button" className="text-[10px] bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded cursor-pointer hover:bg-primary/90 transition-colors">Confirm</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MCPAgentFeature() {
  const steps = [
    { type: "user", text: "Draft a reply to Sarah and schedule a review call this week." },
    { type: "tool", text: 'list_emails({ query: "Sarah Q3 deck" })' },
    { type: "tool", text: 'check_calendar({ range: "this week" })' },
    { type: "tool", text: 'create_draft({ to: "sarah@acme.com", ... })' },
    { type: "ai",   text: "Draft ready for review. Call booked Wed 2 PM — confirm to send invite." },
  ];
  const [shown, setShown] = useState(1);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (shown < steps.length) {
      t = setTimeout(() => setShown(s => s + 1), 850);
    } else {
      t = setTimeout(() => setShown(1), 2800);
    }
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ai font-heading flex items-center gap-1.5 mb-2"><Sparkles className="size-3 text-ai" strokeWidth={1.75} />MCP-powered AI Agent</p>
        <h3 className="font-sans font-bold text-foreground text-xl leading-snug mb-1">Multi-step. One prompt.</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">OpenAI Agents SDK + Corsair MCP running in sequence.</p>
      </div>
      <div className="bg-background border border-border rounded-xl flex-1 flex flex-col gap-2.5 p-3 overflow-hidden">
        {steps.slice(0, shown).map((s, i) => (
          <div key={i} className={`flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 ${s.type === "user" ? "justify-end" : "justify-start"}`}>
            {s.type === "tool" ? (
              <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2 max-w-[90%]">
                <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />{s.text}
                </p>
              </div>
            ) : s.type === "user" ? (
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                <p className="text-[11px] leading-relaxed">{s.text}</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="size-6 rounded-full bg-primary/10 border border-ai flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="size-3 text-ai" strokeWidth={1.75} />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                  <p className="text-[11px] text-foreground/80 leading-relaxed">{s.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <section className="bg-secondary/30 dark:bg-white/[0.022] py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-lg">
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-4">Built different, on purpose.</h2>
          <p className="text-base text-muted-foreground leading-relaxed">Every feature in Tsunagu is designed around one idea: the AI handles the grunt work, you make the calls.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><SearchFeature /></div>
          <div className="bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><WebhookFeature /></div>
          <div className="bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><KeyboardFeature /></div>
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><ZeroTrustFeature /></div>
          <div className="bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><CalendarFeature /></div>
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 min-h-[360px] flex flex-col"><MCPAgentFeature /></div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 8b: AI Workflow Animation ──────────────────────────────────────

function AIWorkflow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "You type a request",     detail: "\"Schedule a follow-up with Sarah for next Tuesday at 10am\"",  color: "bg-primary/15 border-ai text-ai" },
    { label: "AI reads your calendar", detail: "Checks availability, finds conflicts, resolves attendees",        color: "bg-primary/15 border-ai text-ai" },
    { label: "Draft appears for review", detail: "Event card shows all details — you can edit any field",         color: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300" },
    { label: "You confirm",            detail: "One click. Event created, invite sent through Google Calendar",    color: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400" },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % steps.length), 2200);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <section className="bg-background py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-ai font-heading">
            <Sparkles className="size-3 text-ai" strokeWidth={1.75} />
            AI Agent Flow
          </div>
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-5">
            The AI does the work. You stay in control.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Every action goes through a preview step. You see exactly what the AI plans to do before it happens — and you decide if it does.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`w-full text-left flex items-start gap-4 px-6 py-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  i === activeStep
                    ? `${step.color} shadow-sm scale-[1.01]`
                    : "bg-card border-border hover:border-foreground/20"
                }`}
              >
                <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                  i === activeStep ? "bg-foreground/10" : "bg-secondary"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold mb-0.5 ${i === activeStep ? "" : "text-foreground/70"}`}>{step.label}</p>
                  <p className={`text-[12px] leading-relaxed ${i === activeStep ? "opacity-80" : "text-muted-foreground/50"}`}>{step.detail}</p>
                </div>
                {i === activeStep && (
                  <div className="size-2 rounded-full bg-current opacity-60 shrink-0 mt-2.5 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6 font-medium">
            Works for emails too — draft, review, send. The same human-in-the-loop flow.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Testimonials ─────────────────────────────────────────────────

const TESTIMONIALS_COL1 = [
  { name: "Maria G.",      role: "Founder",              initial: "M", color: AV_A,  quote: "I used to start every morning triaging 80 emails across two apps. Tsunagu collapsed that into one focused session that takes half the time." },
  { name: "James T.",      role: "Executive Recruiter",  initial: "J", color: AV_B, quote: "The AI drafts are genuinely good. They match my tone well enough that I send most of them without editing." },
  { name: "Priya N.",      role: "Operations Lead",      initial: "P", color: AV_C,  quote: "Having email and calendar in one place sounds like a small thing. But the lost context from switching apps was adding up more than I realized." },
  { name: "David K.",      role: "Product Manager",      initial: "D", color: AV_NEUTRAL, quote: "The command palette alone saved me. I used to hunt through Gmail filters for stuff I needed fast. Now it's just ⌘K and done." },
  { name: "Rachel S.",     role: "Startup CEO",          initial: "R", color: AV_D,    quote: "Tsunagu actually understands context. When I ask it to schedule a follow-up, it checks my calendar and picks a time that makes sense." },
];

const TESTIMONIALS_COL2 = [
  { name: "Ananya M.",     role: "Growth Lead",          initial: "A", color: AV_B, quote: "Real-time sync means my inbox is never stale. Events update the moment a meeting gets rescheduled — no manual refresh, no missed changes." },
  { name: "Tom B.",        role: "Freelance Consultant",  initial: "T", color: AV_A,  quote: "Client emails used to live in my inbox and their calendar invites lived somewhere else. Tsunagu put them in the same view and it changed how I work." },
  { name: "Sunita R.",     role: "Engineering Manager",  initial: "S", color: AV_C,  quote: "The zero-trust draft model is what won me over. Nothing sends without my explicit approval. I can actually trust the AI in my workflow." },
  { name: "Chris L.",      role: "Investor",             initial: "C", color: AV_NEUTRAL, quote: "I get 200+ emails a day. Tsunagu's priority inbox surfaces what actually needs a reply. Everything else waits until I choose to look." },
  { name: "Nina F.",       role: "UX Designer",          initial: "N", color: AV_D,    quote: "Keyboard-first design made me a convert. Tab, arrow, Enter — I handle my entire morning email routine without touching the mouse." },
];

const TESTIMONIALS_COL3 = [
  { name: "Rajan P.",      role: "BD Manager",           initial: "R", color: AV_C,  quote: "AI scheduling is something I didn't know I needed. I describe the meeting in plain English and it finds a slot, drafts the invite, and waits for me to hit confirm." },
  { name: "Sophie W.",     role: "COO",                  initial: "S", color: AV_B, quote: "We evaluated four email clients for our team. Tsunagu was the only one that connected Gmail and Calendar in a way that felt native, not bolted on." },
  { name: "Marcus H.",     role: "SaaS Founder",         initial: "M", color: AV_A,  quote: "I can search emails and events from one bar. That sounds obvious but no other tool does it well. Tsunagu gets it exactly right." },
  { name: "Leila A.",      role: "Chief of Staff",       initial: "L", color: AV_NEUTRAL, quote: "The AI reads the whole thread before drafting. It doesn't just reply to the last message — it considers the whole conversation. That context matters." },
  { name: "Kevin T.",      role: "Head of Sales",        initial: "K", color: AV_D,    quote: "I was skeptical about another AI email tool. But Tsunagu actually delivers on the promise. Fewer tabs, less context switching, more focus." },
];

function TestimonialCard({ name, role, initial, color, quote }: { name: string; role: string; initial: string; color: string; quote: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.40)]">
      <p className="text-sm text-foreground/80 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-2.5 pt-1 border-t border-border">
        <div className={`size-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${color}`}>{initial}</div>
        <div>
          <p className="text-xs font-semibold text-foreground/80">{name}</p>
          <p className="text-[11px] text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialColumn({ items, direction }: { items: typeof TESTIMONIALS_COL1; direction: "up" | "down" }) {
  const doubled = [...items, ...items];
  const cls = direction === "up" ? "animate-marquee-up" : "animate-marquee-down";
  return (
    <div className="overflow-hidden h-[600px]">
      <div className={`flex flex-col gap-4 ${cls}`}>
        {doubled.map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

function Testimonials() {
  return (
    <section className="bg-background py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 text-center">
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight">From people who live in their inbox.</h2>
          <p className="mt-4 text-base text-muted-foreground">Founders, operators, and recruiters who replaced three tools with one.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]">
          <TestimonialColumn items={TESTIMONIALS_COL1} direction="up" />
          <TestimonialColumn items={TESTIMONIALS_COL2} direction="down" />
          <div className="hidden lg:block">
            <TestimonialColumn items={TESTIMONIALS_COL3} direction="up" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 10: Pricing ─────────────────────────────────────────────────────

function Pricing({ onSignIn }: { onSignIn: () => void }) {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      desc: "Everything you need to get started.",
      features: ["Gmail + Calendar connected", "AI chat — 20 requests/day", "Email drafting + scheduling", "Command palette (⌘K)", "Keyboard shortcuts"],
      cta: "Get started free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "per month",
      desc: "For people who live in their inbox.",
      features: ["Everything in Free", "Unlimited AI requests", "Priority inbox analysis", "Real-time webhook sync", "Bring your own OpenAI key"],
      cta: "Start Pro free for 7 days",
      highlight: true,
    },
    {
      name: "Team",
      price: "₹999",
      period: "per user / month",
      desc: "For teams that move fast together.",
      features: ["Everything in Pro", "Shared AI conversation history", "Team calendar view", "Admin dashboard", "Priority support"],
      cta: "Contact us",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-secondary/30 dark:bg-white/[0.022] py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="font-sans font-bold text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-4">Simple, honest pricing.</h2>
          <p className="text-base text-muted-foreground leading-relaxed">Start free. Upgrade when you need more AI. No hidden fees, no lock-in.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col gap-6 transition-all ${
                plan.highlight
                  ? "bg-foreground text-background shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] scale-[1.03]"
                  : "bg-card border border-border hover:border-foreground/20"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-widest font-heading">
                  Most popular
                </div>
              )}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest font-heading mb-3 ${plan.highlight ? "text-background/60" : "text-muted-foreground/60"}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-sans font-bold text-4xl tracking-tight">{plan.price}</span>
                  <span className={`text-xs ${plan.highlight ? "text-background/60" : "text-muted-foreground/60"}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm ${plan.highlight ? "text-background/70" : "text-muted-foreground"}`}>{plan.desc}</p>
              </div>
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${plan.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                    <span className={`mt-[5px] size-1.5 rounded-full shrink-0 ${plan.highlight ? "bg-background/50" : "bg-muted-foreground/40"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={onSignIn}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  plan.highlight
                    ? "bg-background text-foreground hover:bg-background/90"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 11: Footer ──────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-footer text-muted-foreground border-t border-border px-6 pt-16 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
              <TsunaguLogo className="size-7 text-primary" />
              <span className="font-semibold text-base tracking-tight text-[#f8f7f4] font-display">Tsunagu</span>
            </Link>
            <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-44">AI-native email and calendar workspace for people who move fast.</p>
          </div>
          {[
            { label: "Product", links: ["Features", "Changelog", "Roadmap"] },
            { label: "Company", links: ["About", "Blog", "Careers"] },
            { label: "Legal",   links: ["Privacy", "Terms", "Security"] },
          ].map(({ label, links }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8f8f8f] mb-4 font-heading">{label}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}><a href="#" className="text-sm text-[#a1a1aa] hover:text-[#f8f7f4] transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#8f8f8f]">© 2026 Tsunagu. All rights reserved.</p>
          <p className="text-[11px] text-[#6f6f6f]">Built for people who actually ship.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page Assembly ────────────────────────────────────────────────────────────

function PageContent() {
  const { data: session, isPending } = authClient.useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();

  useEffect(() => {
    if (session && !isPending) router.push("/dashboard");
  }, [session, isPending, router]);

  if (session) return null;

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  };

  return (
    <div className="bg-background min-h-screen">
      <Nav onSignIn={handleSignIn} />
      <Hero onSignIn={handleSignIn} error={error} />
      <TrustBand />
      <HowItWorks />
      <FeatureInbox />
      <FeatureAI />
      <CommandPaletteSpot />
      <FeatureCalendar />
      <FeatureGrid />
      <AIWorkflow />
      <Testimonials />
      <Pricing onSignIn={handleSignIn} />
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
