"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getHeader } from "@/lib/email";
import { RiSearchLine, RiLoader4Line, RiMailLine, RiCalendarEventLine, RiFlashlightFill } from "@remixicon/react";

// ── Shared avatar colour helper ───────────────────────────────────────────────
const AVATAR_PALETTE = [
  "bg-pink-500/10 text-pink-500",
  "bg-violet-500/10 text-violet-500",
  "bg-orange-400/10 text-orange-400",
  "bg-emerald-400/10 text-emerald-500",
  "bg-blue-500/10 text-blue-500",
  "bg-amber-500/10 text-amber-500",
];
function senderColorClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ── Date formatters ───────────────────────────────────────────────────────────
function formatEmailDate(email: any): string {
  const raw = email.internalDate
    ? new Date(Number(email.internalDate))
    : new Date(getHeader(email, "Date"));
  if (isNaN(raw.getTime())) return "";
  const now = new Date();
  if (raw.toDateString() === now.toDateString())
    return raw.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return raw.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCalDate(event: any): string {
  const start = event.start?.dateTime ?? event.start?.date;
  if (!start) return "";
  const d = new Date(start);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const dateStr = isToday
    ? "Today"
    : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!event.start?.dateTime) return dateStr;
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ResultItem =
  | { kind: "email"; data: any }
  | { kind: "calendar"; data: any };

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectEmail: (email: any) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CommandPalette({ open, onClose, onSelectEmail }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<any[]>([]);
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchMeta, setSearchMeta] = useState<{ source: string; ms: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flat result list for keyboard nav
  const allResults: ResultItem[] = [
    ...emails.map((d): ResultItem => ({ kind: "email", data: d })),
    ...calEvents.map((d): ResultItem => ({ kind: "calendar", data: d })),
  ];

  // Reset + focus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setEmails([]);
      setCalEvents([]);
      setActiveIndex(0);
      setLoading(false);
      setSearchMeta(null);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Debounced parallel search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setEmails([]);
      setCalEvents([]);
      setLoading(false);
      setSearchMeta(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(query.trim());
        // Email search hits Corsair's local entity cache for instant results.
        const [emailRes, calRes] = await Promise.allSettled([
          fetch(`/api/search/local?q=${q}`).then((r) => r.json()),
          fetch(`/api/calendar/search?q=${q}`).then((r) => r.json()),
        ]);
        if (emailRes.status === "fulfilled") {
          setEmails(emailRes.value.messages ?? []);
          setSearchMeta({ source: emailRes.value.source ?? "cache", ms: emailRes.value.ms ?? 0 });
        } else {
          setEmails([]);
          setSearchMeta(null);
        }
        setCalEvents(calRes.status === "fulfilled" ? (calRes.value.events ?? []) : []);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && allResults[activeIndex]) handleSelect(allResults[activeIndex]);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allResults, activeIndex]);

  const handleSelect = (item: ResultItem) => {
    if (item.kind === "email") {
      onSelectEmail(item.data);
    } else {
      router.push("/dashboard/calendar");
    }
    onClose();
  };

  if (!open) return null;

  const hasResults = allResults.length > 0;

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center pt-[14vh] px-4"
      onMouseDown={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette card */}
      <div
        className="relative w-full max-w-2xl bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150 font-sans"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-border/30">
          {loading ? (
            <RiLoader4Line className="size-5 text-muted-foreground/50 shrink-0 animate-spin" />
          ) : (
            <RiSearchLine className="size-5 text-muted-foreground/50 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emails and calendar…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none leading-none"
          />
          {searchMeta && !loading && (
            <span
              title={searchMeta.source === "cache" ? "Served instantly from Corsair's local cache" : "Fetched live from Gmail"}
              className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${
                searchMeta.source === "cache"
                  ? "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/20"
                  : "text-muted-foreground bg-secondary border-border/40"
              }`}
            >
              <RiFlashlightFill className="size-2.5" />
              {searchMeta.source === "cache" ? "Corsair" : "Gmail"} · {searchMeta.ms}ms
            </span>
          )}
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setQuery(""); setEmails([]); setCalEvents([]); setSearchMeta(null); inputRef.current?.focus(); }}
              className="text-[10px] font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1.5 py-0.5 rounded bg-secondary border border-border/40 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
          <kbd className="h-5 px-1.5 rounded bg-secondary border border-border/50 font-mono text-[9px] font-semibold text-muted-foreground/50 flex items-center shrink-0 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results body */}
        <div className="max-h-95 overflow-y-auto">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2.5 select-none">
              <div className="flex items-center gap-3 text-muted-foreground/15">
                <RiMailLine className="size-7" />
                <RiCalendarEventLine className="size-7" />
              </div>
              <p className="text-xs text-muted-foreground/35 font-medium">
                Search emails and calendar events
              </p>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8b5cf6]/70">
                <RiFlashlightFill className="size-2.5" />
                Instant search, powered by Corsair
              </span>
            </div>
          ) : loading && !hasResults ? (
            <div className="flex items-center justify-center py-14">
              <p className="text-xs text-muted-foreground/35">Searching…</p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 select-none">
              <p className="text-lg font-serif text-foreground/60 tracking-tight">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-muted-foreground/35">Try a different keyword, sender, or event name</p>
            </div>
          ) : (
            <>
              {/* ── Email results ── */}
              {emails.length > 0 && (
                <div>
                  <SectionHeader icon={<RiMailLine className="size-3" />} label="Emails" count={emails.length} />
                  {emails.map((email, i) => {
                    const flatIdx = i;
                    const from = getHeader(email, "From");
                    const subject = getHeader(email, "Subject");
                    const senderName = from.replace(/<[^>]*>/g, "").trim() || from;
                    const initial = senderName.split(" ").map((n: string) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 1) || "?";
                    const avatarColor = senderColorClass(senderName);
                    const isUnread = email.labelIds?.includes("UNREAD");
                    const isActive = flatIdx === activeIndex;

                    return (
                      <ResultRow
                        key={email.id}
                        isActive={isActive}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => handleSelect({ kind: "email", data: email })}
                      >
                        {/* Avatar */}
                        <div className={`size-9 shrink-0 flex items-center justify-center rounded-full text-[13px] font-bold leading-none ${avatarColor}`}>
                          {initial}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className={`text-[13px] truncate ${isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                              {senderName || "(unknown)"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/45 font-mono tabular-nums shrink-0">{formatEmailDate(email)}</span>
                          </div>
                          <p className={`text-xs truncate ${isUnread ? "font-semibold text-foreground" : "text-foreground/55"}`}>
                            {subject || "(no subject)"}
                          </p>
                          <p className="text-[11px] text-muted-foreground/40 truncate">{email.snippet}</p>
                        </div>
                        <EnterHint show={isActive} />
                      </ResultRow>
                    );
                  })}
                </div>
              )}

              {/* ── Calendar results ── */}
              {calEvents.length > 0 && (
                <div>
                  <SectionHeader icon={<RiCalendarEventLine className="size-3" />} label="Calendar" count={calEvents.length} />
                  {calEvents.map((ev, i) => {
                    const flatIdx = emails.length + i;
                    const isActive = flatIdx === activeIndex;
                    const isPast = ev.start?.dateTime
                      ? new Date(ev.start.dateTime) < new Date()
                      : false;

                    return (
                      <ResultRow
                        key={ev.id ?? i}
                        isActive={isActive}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        onClick={() => handleSelect({ kind: "calendar", data: ev })}
                      >
                        {/* Calendar dot */}
                        <div className="size-9 shrink-0 flex items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
                          <RiCalendarEventLine className="size-4 text-violet-500" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className={`text-[13px] truncate font-semibold ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                            {ev.summary || "(No title)"}
                          </p>
                          <p className="text-xs text-muted-foreground/60 truncate font-medium">
                            {formatCalDate(ev)}
                          </p>
                          {ev.location && (
                            <p className="text-[11px] text-muted-foreground/40 truncate">{ev.location}</p>
                          )}
                        </div>
                        <EnterHint show={isActive} />
                      </ResultRow>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-5 py-2.5 border-t border-border/30 bg-secondary/20 flex items-center gap-5 select-none">
          {[
            { key: "↑↓", label: "Navigate" },
            { key: "↵", label: "Open" },
            { key: "Esc", label: "Close" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/45">
              <kbd className="h-4 px-1.5 rounded bg-secondary border border-border/50 font-mono text-[9px] flex items-center shadow-sm">{key}</kbd>
              {label}
            </div>
          ))}
          <div className="ml-auto text-[10px] text-muted-foreground/30 font-mono">
            {allResults.length} result{allResults.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2 bg-secondary/30 border-y border-border/20 select-none">
      <span className="text-muted-foreground/50">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 font-heading">{label}</span>
      <span className="text-[9px] font-bold text-muted-foreground/35 bg-secondary px-1.5 py-0.5 rounded font-mono ml-auto">{count}</span>
    </div>
  );
}

function ResultRow({ children, isActive, onMouseEnter, onClick }: {
  children: React.ReactNode;
  isActive: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-colors duration-75 border-b border-border/10 last:border-0 select-none ${
        isActive ? "bg-secondary/70" : ""
      }`}
    >
      {children}
    </div>
  );
}

function EnterHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <kbd className="size-5 rounded bg-secondary border border-border/50 font-mono text-[10px] font-semibold text-muted-foreground/50 flex items-center justify-center shrink-0">
      ↵
    </kbd>
  );
}
