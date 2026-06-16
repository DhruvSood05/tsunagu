"use client";

import { authClient } from "@/lib/auth-client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme/ThemeProvider";
import Link from "next/link";
import {
  RiGoogleFill,
  RiArrowRightLine,
  RiMailLine,
  RiCalendarLine,
  RiSparkling2Fill,
  RiSearch2Line,
  RiKeyboardLine,
  RiTimeLine,
  RiInboxLine,
  RiCalendarEventLine,
  RiSendPlaneLine,
  RiSunLine,
  RiMoonLine,
} from "@remixicon/react";

// ─── Warm editorial design language ───────────────────────────────────────────
// Canvas: warm paper (--background)  Cards: white (--card)
// Headlines: Instrument Serif (font-serif)  Labels: clean sans (font-heading)
// Accent: violet #8b5cf6 — reserved for AI moments only
//
// Avatar pastels (tuned for light surfaces)
const AV_VIOLET = "bg-violet-500/10 text-violet-600";
const AV_EMERALD = "bg-emerald-500/10 text-emerald-600";
const AV_ORANGE = "bg-orange-500/10 text-orange-600";
const AV_PINK = "bg-pink-500/10 text-pink-600";
const AV_NEUTRAL = "bg-secondary text-muted-foreground";

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
    { from: "Sarah Chen",  subj: "Q3 investor update deck",  av: "SC", c: AV_VIOLET,  time: "9:41 AM",   addr: "sarah@acme.com",       unread: true,  body: ["Hi — I have attached the revised slides with updated financial projections and the go-to-market narrative. Key changes on slides 8 and 12 address the concerns from last quarter.", "Let me know if you want to hop on a call before the board presentation on Thursday. I am free from 2 to 4 PM."] },
    { from: "Marcus Reed", subj: "Re: Partnership proposal", av: "MR", c: AV_EMERALD, time: "8:15 AM",   addr: "marcus@ventures.co",   unread: true,  body: ["Thanks for sending the proposal over. The terms look reasonable overall.", "Two things worth discussing before we move forward: the exclusivity clause and the revenue share model. Are you free this week?"] },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",     av: "AK", c: AV_ORANGE,  time: "Yesterday", addr: "alex@studio.io",       unread: false, body: ["Hey, do you have 20 minutes to sync tomorrow? I want to walk through the updated design before we present to the client.", "Happy to jump on a call around 2 PM if that works."] },
    { from: "Notion",      subj: "Your workspace summary",   av: "N",  c: AV_NEUTRAL, time: "Yesterday", addr: "noreply@notion.so",    unread: false, body: ["Here is your weekly workspace summary.", "12 pages edited, 3 databases updated, 2 comments resolved this week."] },
    { from: "GitHub",      subj: "Security advisory",        av: "G",  c: AV_NEUTRAL, time: "Mon",       addr: "noreply@github.com",   unread: false, body: ["A vulnerability has been reported in a dependency used by one of your repositories.", "We recommend updating to the latest version as soon as possible."] },
    { from: "Design team", subj: "Figma comments on v3",    av: "DT", c: AV_PINK,    time: "Mon",       addr: "design@company.io",    unread: false, body: ["Left a few comments on the v3 mockups in Figma. Nothing major — mostly spacing adjustments on the dashboard header.", "Let me know when you are ready to review."] },
  ];

  const active = emails[activeRow];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_40px_100px_-30px_rgba(33,30,26,0.30)]">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-secondary/50">
        <div className="size-2.5 rounded-full bg-foreground/10" />
        <div className="size-2.5 rounded-full bg-foreground/10" />
        <div className="size-2.5 rounded-full bg-foreground/10" />
        <div className="flex-1 mx-6 h-4 rounded bg-background flex items-center justify-center">
          <span className="text-[8px] text-muted-foreground/50 font-mono">app.tsunagu.ai/dashboard</span>
        </div>
      </div>

      <div className="flex" style={{ height: 360 }}>
        <div className="w-36 border-r border-border flex flex-col p-2.5 gap-2 bg-secondary/40 shrink-0">
          <div className="flex items-center gap-1.5 px-1.5 py-1 mb-1">
            <div className="size-4 rounded bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-[7px] font-bold leading-none font-heading">T</span>
            </div>
            <span className="text-[8px] font-bold tracking-wider text-muted-foreground font-heading">TSUNAGU</span>
          </div>
          {["Inbox", "Sent", "Drafts", "Calendar"].map((item, i) => (
            <div key={item} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[8px] font-medium ${i === 0 ? "bg-secondary text-foreground" : "text-muted-foreground/60"}`}>{item}</div>
          ))}
          <div className="mt-auto pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[8px] text-muted-foreground/60">
              <RiSparkling2Fill className="size-2.5 text-violet-500/60" />
              AI Assistant
            </div>
          </div>
        </div>

        <div className="w-44 border-r border-border flex flex-col bg-background shrink-0">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Inbox</span>
            <span className="text-[7px] font-mono bg-secondary text-muted-foreground/60 px-1.5 py-0.5 rounded">6</span>
          </div>
          <div className="flex-1 overflow-hidden divide-y divide-border">
            {emails.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveRow(i)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer ${i === activeRow ? "bg-secondary" : "hover:bg-secondary/50"}`}
              >
                <div className={`size-5 rounded-full flex items-center justify-center text-[6px] font-bold shrink-0 ${e.c}`}>{e.av[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[8px] truncate ${e.unread && i !== activeRow ? "font-semibold text-foreground" : "text-muted-foreground/70"}`}>{e.from}</p>
                  <p className={`text-[7px] truncate mt-0.5 ${e.unread && i !== activeRow ? "text-muted-foreground" : "text-muted-foreground/40"}`}>{e.subj}</p>
                </div>
                {e.unread && i !== activeRow && <div className="size-1 rounded-full bg-violet-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-card">
          <div className="px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`size-7 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${active.c}`}>{active.av}</div>
              <div>
                <p className="text-[9px] font-semibold text-foreground">{active.from}</p>
                <p className="text-[7px] text-muted-foreground/70">{active.addr} · {active.time}</p>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-foreground">{active.subj}</p>
          </div>
          <div className="flex-1 px-5 py-3 overflow-hidden">
            {active.body.map((para, i) => (
              <p key={i} className={`text-[8px] leading-relaxed ${i === 0 ? "text-muted-foreground mb-2" : "text-muted-foreground/70"}`}>{para}</p>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-3 py-2">
              <RiSparkling2Fill className="size-3 text-violet-500 shrink-0" />
              <Typewriter
                phrases={["Draft a reply with AI…", "Summarize this thread…", "Schedule a follow-up…"]}
                className="text-[8px] text-muted-foreground/70"
                caretClassName="text-violet-500"
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
    { from: "Sarah Chen",  subj: "Q3 investor update deck",  snippet: "I have attached the revised slides...",  time: "9:41 AM",   unread: true,  c: AV_VIOLET },
    { from: "Marcus Reed", subj: "Re: Partnership proposal", snippet: "Thanks for sending this over...",          time: "8:15 AM",   unread: true,  c: AV_EMERALD },
    { from: "Notion",      subj: "Your workspace summary",   snippet: "Here are highlights from this week...",   time: "Yesterday", unread: false, c: AV_NEUTRAL },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",     snippet: "Hey, do you have 20 minutes to...",       time: "Yesterday", unread: false, c: AV_ORANGE },
    { from: "GitHub",      subj: "New security advisory",    snippet: "A vulnerability has been reported...",    time: "Mon",       unread: false, c: AV_NEUTRAL },
  ];

  const handleClick = (i: number) => {
    setSelectedId(i);
    setReadIds((prev) => new Set([...prev, i]));
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(33,30,26,0.22)]">
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
              {!isRead && <div className="size-1.5 rounded-full bg-violet-500 shrink-0" />}
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
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_30px_70px_-30px_rgba(33,30,26,0.22)]" style={{ minHeight: 268 }}>
        <div className="text-center py-10">
          <div className="size-10 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3">
            <RiSendPlaneLine className="size-4 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-foreground/80">Message sent</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Delivered via Gmail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(33,30,26,0.22)]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">New Message</span>
        <span className="text-[9px] text-violet-600 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <RiSparkling2Fill className="size-2.5" />
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
    { day: 0, start: 1, len: 1, title: "1:1 Sarah",     c: "bg-violet-500/15 border-violet-500/30 text-violet-700", time: "10:00 AM", info: "Zoom · 30 min" },
    { day: 1, start: 0, len: 2, title: "Investor call", c: "bg-blue-500/15 border-blue-500/30 text-blue-700",        time: "9:00 AM",  info: "Google Meet · Marcus Reed" },
    { day: 2, start: 2, len: 1, title: "Design review", c: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700", time: "11:00 AM", info: "With design team" },
    { day: 3, start: 3, len: 1, title: "Standup",       c: "bg-orange-500/15 border-orange-500/30 text-orange-700", time: "12:00 PM", info: "Daily sync" },
    { day: 4, start: 0, len: 3, title: "All-hands",     c: "bg-pink-500/15 border-pink-500/30 text-pink-700",        time: "9:00 AM",  info: "Main conference room" },
  ];

  const sel = selectedEvIdx !== null ? events[selectedEvIdx] : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_30px_70px_-30px_rgba(33,30,26,0.22)]">
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
      <div className="p-3">
        <div className="flex gap-1 mb-1">
          <div className="w-8 shrink-0" />
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {days.map((d) => <div key={d} className="text-center text-[8px] font-medium text-muted-foreground/60 pb-1">{d}</div>)}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-8 shrink-0 space-y-[14px] pt-1">
            {times.map((t) => <div key={t} className="text-[7px] text-muted-foreground/40 text-right leading-none">{t}</div>)}
          </div>
          <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {days.map((_, di) => (
              <div key={di} className="relative">
                {times.map((_, ti) => {
                  const evIdx = events.findIndex((e) => e.day === di && e.start === ti);
                  const ev = evIdx >= 0 ? events[evIdx] : null;
                  return (
                    <div key={ti} className="h-7 border-t border-border relative">
                      {ev && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvIdx(selectedEvIdx === evIdx ? null : evIdx)}
                          className={`absolute inset-x-0 top-0 w-full text-left rounded px-1 py-0.5 border text-[7px] font-medium overflow-hidden z-10 cursor-pointer transition-all ${ev.c} ${selectedEvIdx === evIdx ? "ring-1 ring-foreground/20 brightness-95" : "hover:brightness-105"}`}
                          style={{ height: `${ev.len * 28 - 2}px` }}
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
              <p className="text-[9px] font-semibold text-foreground/80">{sel.title}</p>
              <p className="text-[8px] text-muted-foreground mt-0.5">{days[sel.day]} · {sel.time}</p>
              <p className="text-[8px] text-muted-foreground/60 mt-0.5">{sel.info}</p>
            </div>
            <button type="button" onClick={() => setSelectedEvIdx(null)} className="text-[10px] text-muted-foreground/60 hover:text-foreground cursor-pointer transition-colors shrink-0">✕</button>
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
    { from: "Sarah Chen",  subj: "Q3 investor update deck",      time: "9:41 AM",   c: AV_VIOLET },
    { from: "Marcus Reed", subj: "Investor partnership proposal", time: "Mon",       c: AV_EMERALD },
    { from: "Notion",      subj: "Your workspace summary",        time: "Yesterday", c: AV_NEUTRAL },
    { from: "Alex Kim",    subj: "Quick sync tomorrow?",          time: "Yesterday", c: AV_ORANGE },
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
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_40px_100px_-30px_rgba(33,30,26,0.32)] max-w-xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <RiSearch2Line className="size-4 text-muted-foreground/60 shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
          placeholder="Search emails and calendar..."
          className="text-sm text-foreground/80 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/50 caret-violet-500"
        />
        <kbd className="text-[9px] font-mono text-muted-foreground/60 bg-secondary border border-border px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>
      <div className="py-1">
        {filteredEmails.length > 0 && (
          <div>
            <div className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 flex items-center gap-1.5">
              <RiMailLine className="size-2.5" /> Emails
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
              <RiCalendarLine className="size-2.5" /> Calendar
            </div>
            {filteredCal.map((ev, i) => {
              const flatIdx = filteredEmails.length + i;
              const isActive = flatIdx === activeIdx;
              return (
                <button key={i} type="button" onMouseEnter={() => setActiveIdx(flatIdx)} className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                  <div className="size-7 rounded-full bg-blue-500/12 text-blue-600 flex items-center justify-center shrink-0">
                    <RiCalendarEventLine className="size-3.5" />
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
        <RiSunLine className="size-4 text-amber-400" />
      ) : (
        <RiMoonLine className="size-4 text-indigo-500" />
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
          <div
            className={`rounded-md bg-primary flex items-center justify-center shadow-sm transition-all duration-300 ${
              scrolled ? "size-5" : "size-6"
            }`}
          >
            <span className="text-primary-foreground text-[10px] font-bold leading-none font-heading">T</span>
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground font-serif">Tsunagu</span>
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
            <RiArrowRightLine className="size-3.5" />
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
        <div className="absolute top-[-12%] left-[18%] w-[540px] h-[540px] rounded-full bg-amber-300/25 blur-[130px] animate-[drift-1_19s_ease-in-out_infinite]" />
        <div className="absolute top-[6%] right-[12%] w-[480px] h-[480px] rounded-full bg-violet-400/15 blur-[140px] animate-[drift-2_23s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-14%] left-[38%] w-[500px] h-[500px] rounded-full bg-rose-300/15 blur-[130px] animate-[drift-3_27s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2.5 mb-8 pl-2.5 pr-4 py-1.5 rounded-full border border-border bg-card/70 backdrop-blur-sm shadow-sm">
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-violet-500/60 animate-ping" />
            <span className="relative inline-flex rounded-full size-1.5 bg-violet-500" />
          </span>
          <span className="inline-block min-w-[188px] text-left text-[12.5px] font-medium text-foreground/70 font-heading">
            <Typewriter
              phrases={["Draft replies with AI", "Schedule meetings naturally", "Search your inbox instantly"]}
              caretClassName="text-violet-500"
            />
          </span>
        </div>

        <h1 className="font-serif text-foreground tracking-tight leading-[1.05] text-5xl sm:text-6xl lg:text-[80px] xl:text-[88px] mb-6">
          Email and calendar,<br />
          <span className="italic text-muted-foreground">in one quiet workspace.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed mb-10">
          Connect Gmail and Google Calendar. Draft with AI, schedule naturally, and search everything from a single, keyboard-driven interface.
        </p>

        {error && (
          <div className="mb-6 px-4 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive max-w-sm">
            Authentication failed. Please try again.
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={onSignIn} className="flex items-center gap-2.5 bg-primary text-primary-foreground font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg cursor-pointer">
            <RiGoogleFill className="size-4" />
            Continue with Google
          </button>
          <p className="text-[11px] text-muted-foreground/70 font-medium">No credit card · No setup · Works with your existing Gmail</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 px-4">
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
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight">
            Set up in a minute. Use for years.
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} className={`py-10 sm:py-0 ${i === 0 ? "sm:pr-10" : i === steps.length - 1 ? "sm:pl-10" : "sm:px-10"}`}>
              <p className="text-[11px] font-bold font-mono text-muted-foreground/40 mb-7 tracking-widest">{n}</p>
              <h3 className="font-serif text-foreground text-xl mb-3 tracking-tight leading-snug">{title}</h3>
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
    <section id="features" className="bg-secondary/30 py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-heading">
            <RiInboxLine className="size-3" />
            Unified Inbox
          </div>
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
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
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600 font-heading">
            <RiSparkling2Fill className="size-3" />
            AI Drafting
          </div>
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
            Write the right reply in seconds, not minutes.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            The AI reads the thread, understands context, and drafts a response in your voice. Hit Regenerate to try a different angle. Hit Send to deliver it through your real Gmail address.
          </p>
          <ul className="space-y-3">
            {["Contextual drafts based on full thread history", "One-click regenerate for a different tone or angle", "Sends through your real Gmail address", "Replies that sound like you, not like software"].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="size-1 rounded-full bg-violet-500/50 shrink-0 mt-[7px]" />
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
    <section id="product" className="bg-secondary/30 py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground font-heading">
            <RiKeyboardLine className="size-3" />
            Command Palette
          </div>
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-5">
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
            <RiCalendarLine className="size-3" />
            Calendar
          </div>
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-[1.1] mb-5">
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
            "radial-gradient(240px circle at var(--mx) var(--my), color-mix(in oklab, #8b5cf6 13%, transparent), transparent 72%)",
        }}
      />
      {children}
    </div>
  );
}

// ─── Section 8: Feature Grid ─────────────────────────────────────────────────

function FeatureGrid() {
  const features = [
    { icon: RiSearch2Line,       title: "Full-text search",   desc: "Find any email by sender, subject, keyword, or date range. Results appear instantly across your entire history." },
    { icon: RiTimeLine,          title: "Real-time inbox",    desc: "Your inbox reflects the live state of Gmail. No manual refresh, no missed messages, no stale data." },
    { icon: RiKeyboardLine,      title: "Keyboard-first",     desc: "Navigate, compose, archive, and schedule without reaching for the mouse. Built for people who prefer speed." },
    { icon: RiSendPlaneLine,     title: "Direct send",        desc: "Compose and send through your own Gmail account. Recipients see mail from your real address." },
    { icon: RiCalendarEventLine, title: "Meeting management", desc: "Create, edit, and cancel events. Send invites, check availability, and block time in seconds." },
    { icon: RiSparkling2Fill,    title: "AI assistant",       desc: "Summarize threads, schedule meetings, draft replies, and triage your inbox in plain language." },
  ];
  return (
    <section className="bg-secondary/30 py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-lg">
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight mb-4">Everything in one place.</h2>
          <p className="text-base text-muted-foreground leading-relaxed">Tsunagu covers the full range of what you do in email and calendar, without the overhead of managing multiple apps.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-border bg-border">
          {features.map(({ icon: Icon, title, desc }) => (
            <SpotlightCard key={title} className="bg-card p-8 transition-colors hover:bg-secondary/30">
              <div className="relative z-10 size-9 rounded-lg bg-secondary border border-border flex items-center justify-center mb-5 group-hover:border-[#8b5cf6]/30 transition-colors">
                <Icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="relative z-10 font-serif text-foreground text-lg mb-2">{title}</h3>
              <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 9: Testimonials ─────────────────────────────────────────────────

function Testimonials() {
  return (
    <section className="bg-background py-32 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <h2 className="font-serif text-foreground text-3xl sm:text-[40px] tracking-tight leading-tight">From people who live in their inbox.</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-9 flex flex-col justify-between gap-10 hover:border-foreground/15 transition-colors shadow-[0_20px_50px_-30px_rgba(33,30,26,0.18)]">
            <p className="text-2xl sm:text-3xl font-serif italic text-foreground/85 leading-snug tracking-tight">
              &ldquo;I used to start every morning triaging 80 emails across two apps. Tsunagu collapsed that into one focused session that takes half the time.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">M</div>
              <div>
                <p className="text-sm font-semibold text-foreground/80">Maria G.</p>
                <p className="text-xs text-muted-foreground">Founder</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex-1 bg-card border border-border rounded-2xl p-7 flex flex-col justify-between gap-6 hover:border-foreground/15 transition-colors">
              <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;The AI drafts are genuinely good. They match my tone well enough that I send most of them without editing.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground">J</div>
                <div>
                  <p className="text-xs font-semibold text-foreground/80">James T.</p>
                  <p className="text-[10px] text-muted-foreground">Executive Recruiter</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl p-7 flex flex-col justify-between gap-6 hover:border-foreground/15 transition-colors">
              <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;Having email and calendar in one place sounds like a small thing. But the lost context from switching between apps was adding up to more than I realized.&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground">P</div>
                <div>
                  <p className="text-xs font-semibold text-foreground/80">Priya N.</p>
                  <p className="text-[10px] text-muted-foreground">Operations Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 10: CTA Band ────────────────────────────────────────────────────

function CTABand({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section id="pricing" className="bg-secondary/30 py-32 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-3xl px-8 py-16 text-center shadow-[0_30px_80px_-40px_rgba(33,30,26,0.25)]">
          <h2 className="font-serif text-foreground text-4xl sm:text-5xl tracking-tight leading-tight mb-5">Ready to reclaim your inbox?</h2>
          <p className="text-base text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
            Connect Gmail and Google Calendar in under a minute. No configuration, no migration, no setup guides.
          </p>
          <button type="button" onClick={onSignIn} className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground font-semibold text-sm px-8 py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg cursor-pointer">
            <RiGoogleFill className="size-4" />
            Get started free
          </button>
          <p className="text-[11px] text-muted-foreground/60 mt-4">No credit card required</p>
        </div>
      </div>
    </section>
  );
}

// ─── Section 11: Footer ──────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-secondary/40 border-t border-border px-6 pt-16 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-16">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
              <div className="size-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[11px] font-bold leading-none font-heading">T</span>
              </div>
              <span className="font-semibold text-base tracking-tight text-foreground font-serif">Tsunagu</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-44">AI-native email and calendar workspace for people who move fast.</p>
          </div>
          {[
            { label: "Product", links: ["Features", "Changelog", "Roadmap"] },
            { label: "Company", links: ["About", "Blog", "Careers"] },
            { label: "Legal",   links: ["Privacy", "Terms", "Security"] },
          ].map(({ label, links }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-4 font-heading">{label}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground/60">© 2026 Tsunagu. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground/40">Built for people who actually ship.</p>
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
      <Testimonials />
      <CTABand onSignIn={handleSignIn} />
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
