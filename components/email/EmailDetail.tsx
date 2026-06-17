"use client";

import { useEffect, useMemo, useState } from "react";
import { getHeader, decodeEmailBody } from "@/lib/email";
import { detectEventFromEmail } from "@/lib/event-detect";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/lib/theme/ThemeProvider";
import AISummaryCard from "@/components/ai/AISummaryCard";
import {
  RiArrowLeftLine,
  RiReplyLine,
  RiDeleteBinLine,
  RiAttachmentLine,
  RiSendPlaneLine,
  RiCalendarEventLine,
  RiCheckLine,
  RiSparkling2Line,
  RiSparkling2Fill,
  RiAlertLine,
  RiShareForwardLine,
  RiArchiveLine,
} from "@remixicon/react";

interface EmailDetailProps {
  email: any;
  onClose: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  replyKey?: number;
  onAnalyzed?: (emailId: string, priority: string) => void;
}

interface CalendarOption {
  id: string;
  summary?: string;
}

function SenderAvatar({ url, initials }: { url?: string; initials: string }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={initials}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="size-9 rounded-full object-cover shrink-0 border border-border/40 shadow-sm"
      />
    );
  }
  return (
    <div className="size-9 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/40">
      <span className="text-xs font-semibold text-foreground leading-none">{initials}</span>
    </div>
  );
}

export default function EmailDetail({ email, onClose, onDelete, onArchive, replyKey, onAnalyzed }: EmailDetailProps) {
  const { theme } = useTheme();
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [replyTo, setReplyTo] = useState(() => {
    const f = getHeader(email, "From");
    return f.match(/<([^>]+)>/)?.[1] ?? f;
  });
  const [replyBody, setReplyBody] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Forward compose state
  const [forwardTo, setForwardTo] = useState("");
  const [forwardBody, setForwardBody] = useState("");
  const [forwardFiles, setForwardFiles] = useState<FileList | null>(null);
  const [forwardSending, setForwardSending] = useState(false);
  const [forwardStatus, setForwardStatus] = useState<string | null>(null);

  // AI Analysis States
  const [aiData, setAiData] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [replyGenerating, setReplyGenerating] = useState(false);

  const [iframeHeight, setIframeHeight] = useState(500);

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const h = e.currentTarget.contentDocument?.body?.scrollHeight ?? 500;
      setIframeHeight(Math.max(300, h + 48));
    } catch {
      // sandboxed cross-origin email — keep default height
    }
  };

  // Add-to-calendar state
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStart, setEventStart] = useState("09:00");
  const [eventEnd, setEventEnd] = useState("10:00");
  const [eventCalendar, setEventCalendar] = useState("primary");
  const [eventDesc, setEventDesc] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [addStatus, setAddStatus] = useState<"idle" | "success" | "error">("idle");

  const isArchived = !(email.labelIds ?? []).includes("INBOX");

  const subject = getHeader(email, "Subject");
  const from = getHeader(email, "From");
  const to = getHeader(email, "To");
  const date = getHeader(email, "Date");
  const { content, isHtml } = decodeEmailBody(email);

  const senderName = from.replace(/<[^>]*>/g, "").trim();
  const senderEmail = from.match(/<([^>]+)>/)?.[1] ?? from;
  const initials = senderName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || senderEmail[0]?.toUpperCase() || "?";

  const dateObj = email.internalDate
    ? new Date(Number(email.internalDate))
    : date ? new Date(date) : null;
  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  // Detect event info once on mount
  const detected = useMemo(
    () => detectEventFromEmail(subject, email?.snippet ?? "", isHtml ? "" : content, senderName, senderEmail),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email?.id]
  );

  // Auto-mark as read (fire-and-forget)
  useEffect(() => {
    if (!email?.id || !email.labelIds?.includes("UNREAD")) return;
    fetch(`/api/emails/${email.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
    }).catch(() => {});
  }, [email?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open reply when keyboard shortcut fires
  useEffect(() => {
    if (!replyKey) return;
    setShowReply(true);
    setShowForward(false);
    setShowAddEvent(false);
  }, [replyKey]);

  // Reset AI data when a different email is opened
  useEffect(() => {
    setAiData(null);
  }, [email?.id]);

  const handleSummarize = async () => {
    if (!email?.id || aiLoading) return;
    setAiLoading(true);
    setAiData(null);
    try {
      const res = await fetch("/api/ai/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setAiData({ _rateLimited: true, limit: err.limit ?? 10 });
          return;
        }
        throw new Error();
      }
      const data = await res.json();
      setAiData(data);
      if (data.priority) onAnalyzed?.(email.id, data.priority);
    } catch {
      // leave aiData null so button stays visible
    } finally {
      setAiLoading(false);
    }
  };

  // Load calendars when add-event panel opens
  useEffect(() => {
    if (!showAddEvent || calendars.length > 0) return;
    fetch("/api/calendar/calendars")
      .then((r) => r.json())
      .then((data) => {
        const list: CalendarOption[] = data.calendars ?? [{ id: "primary", summary: "My Calendar" }];
        setCalendars(list);
        setEventCalendar(list[0]?.id ?? "primary");
      })
      .catch(() => setCalendars([{ id: "primary", summary: "My Calendar" }]));
  }, [showAddEvent, calendars.length]);

  const openAddEvent = () => {
    setEventTitle(detected.title);
    setEventDate(detected.date);
    setEventStart(detected.startTime);
    setEventEnd(detected.endTime);
    setEventDesc(detected.description);
    setAddStatus("idle");
    setShowReply(false);
    setShowForward(false);
    setShowAddEvent(true);
  };

  const openForward = () => {
    const textContent = !isHtml ? content : (email.snippet ?? "");
    setForwardBody(
      `\n\n---------- Forwarded message ----------\nFrom: ${from}\nDate: ${date}\nSubject: ${subject}\nTo: ${to}\n\n${textContent}`
    );
    setForwardTo("");
    setForwardStatus(null);
    setShowForward(true);
    setShowReply(false);
    setShowAddEvent(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/emails/${email.id}`, { method: "DELETE" });
    onDelete();
  };

  const handleArchive = async () => {
    setArchiving(true);
    if (isArchived) {
      // Unarchive — add INBOX label back
      await fetch(`/api/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addLabelIds: ["INBOX"] }),
      }).catch(() => {});
    } else {
      // Archive — remove INBOX label
      await fetch(`/api/emails/${email.id}/archive`, { method: "POST" }).catch(() => {});
    }
    onArchive?.();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const fd = new FormData();
    fd.set("to", replyTo);
    fd.set("body", replyBody);
    if (files) Array.from(files).forEach((f) => fd.append("attachments", f));
    try {
      const res = await fetch(`/api/emails/${email.id}/reply`, { method: "POST", body: fd });
      if (res.ok) {
        setStatus("sent");
        setReplyBody("");
        setFiles(null);
        setShowReply(false);
      } else {
        setStatus("error");
      }
    } finally {
      setSending(false);
    }
  };

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setForwardSending(true);
    setForwardStatus(null);
    const fd = new FormData();
    fd.set("to", forwardTo);
    fd.set("body", forwardBody);
    fd.set("subject", subject.startsWith("Fwd:") ? subject : `Fwd: ${subject}`);
    if (forwardFiles) Array.from(forwardFiles).forEach((f) => fd.append("attachments", f));
    try {
      const res = await fetch(`/api/emails/${email.id}/forward`, { method: "POST", body: fd });
      if (res.ok) {
        setForwardStatus("sent");
        setForwardBody("");
        setForwardTo("");
        setForwardFiles(null);
        setTimeout(() => setShowForward(false), 1500);
      } else {
        setForwardStatus("error");
      }
    } finally {
      setForwardSending(false);
    }
  };

  const handleSuggestedReplyClick = async (draftPrompt: string) => {
    setReplyGenerating(true);
    setShowReply(true);
    setReplyBody("");
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id, prompt: draftPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setReplyBody(data.reply ?? "");
      }
    } catch {
      // fallback
    } finally {
      setReplyGenerating(false);
    }
  };

  const handleCustomAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setReplyGenerating(true);
    setShowReply(true);
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id, prompt: aiPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setReplyBody(data.reply ?? "");
        setAiPrompt("");
      }
    } catch {
      // fallback
    } finally {
      setReplyGenerating(false);
    }
  };

  const handleAddEvent = async () => {
    setAddingEvent(true);
    setAddStatus("idle");
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const startDateTime = `${eventDate}T${eventStart}:00`;
      const endDateTime = `${eventDate}T${eventEnd}:00`;
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: eventCalendar || undefined,
          event: {
            summary: eventTitle,
            description: eventDesc || undefined,
            start: { dateTime: startDateTime, timeZone: tz },
            end: { dateTime: endDateTime, timeZone: tz },
          },
          sendUpdates: "all",
        }),
      });
      if (res.ok) {
        setAddStatus("success");
        setTimeout(() => setShowAddEvent(false), 1500);
      } else {
        setAddStatus("error");
      }
    } catch {
      setAddStatus("error");
    } finally {
      setAddingEvent(false);
    }
  };

  // Dynamically configure email reader colors depending on theme
  const isDark = theme === "dark";
  const textColor = isDark ? "#f8f9fa" : "#111111";
  const linkColor = isDark ? "#60a5fa" : "#2563eb";
  const blockquoteBorder = isDark ? "#2d2f39" : "#e4e4e7";
  const blockquoteColor = isDark ? "#8e919a" : "#71717a";
  const codeBg = isDark ? "#17181c" : "#f4f4f5";
  const borderCol = isDark ? "rgba(255,255,255,0.06)" : "#e4e4e7";

  const emailStyles = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body {
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13.5px;
        line-height: 1.6;
        color: ${textColor};
        margin: 0;
        padding: 24px 20px;
        word-break: break-word;
        background-color: transparent;
      }
      a { color: ${linkColor}; text-decoration: none; }
      a:hover { text-decoration: underline; }
      img { max-width: 100%; height: auto; border-radius: 8px; }
      blockquote { border-left: 3px solid ${blockquoteBorder}; margin: 12px 0; padding: 4px 16px; color: ${blockquoteColor}; }
      pre, code { font-size: 13px; background: ${codeBg}; border-radius: 6px; padding: 4px 6px; font-family: monospace; border: 1px solid ${borderCol}; }
      table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      td, th { padding: 8px 10px; border-bottom: 1px solid ${borderCol}; }
      th { text-align: left; font-weight: 600; color: ${textColor}; }
    </style>
  `;

  const srcDoc = isHtml
    ? `<!DOCTYPE html><html><head><meta charset="utf-8">${emailStyles}</head><body>${content}</body></html>`
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card select-none font-sans">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0 bg-card/60 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close reading panel (Esc)" className="hover:bg-secondary rounded-md cursor-pointer">
          <RiArrowLeftLine className="size-4 text-muted-foreground hover:text-foreground" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={showAddEvent ? "secondary" : "outline"}
            size="sm"
            onClick={showAddEvent ? () => setShowAddEvent(false) : openAddEvent}
            className="gap-1.5 rounded-md border-border/60 text-xs px-2.5 h-8 font-semibold cursor-pointer"
          >
            <RiCalendarEventLine className="size-3.5 text-muted-foreground" />
            Calendar
          </Button>
          <Button
            variant={showForward ? "secondary" : "outline"}
            size="sm"
            onClick={showForward ? () => setShowForward(false) : openForward}
            className="gap-1.5 rounded-md border-border/60 text-xs px-2.5 h-8 font-semibold cursor-pointer"
          >
            <RiShareForwardLine className="size-3.5 text-muted-foreground" />
            Forward
          </Button>
          <Button
            variant={showReply ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setShowReply(!showReply); setShowForward(false); setShowAddEvent(false); }}
            className="gap-1.5 rounded-md border-border/60 text-xs px-2.5 h-8 font-semibold cursor-pointer"
            title="Reply (R)"
          >
            <RiReplyLine className="size-3.5 text-muted-foreground" />
            Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={archiving}
            className="gap-1.5 rounded-md border-border/60 text-xs px-2.5 h-8 font-semibold cursor-pointer"
            title={isArchived ? "Move back to Inbox" : "Archive (E)"}
          >
            <RiArchiveLine className="size-3.5 text-muted-foreground" />
            {archiving
              ? (isArchived ? "Moving..." : "Archiving")
              : (isArchived ? "Unarchive" : "Archive")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5 rounded-md text-xs px-2.5 h-8 font-semibold cursor-pointer"
          >
            <RiDeleteBinLine className="size-3.5" />
            {deleting ? "Deleting" : "Trash"}
          </Button>
        </div>
      </div>

      {/* Main detail container */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/20">

        {/* Email Subject & Sender info */}
        <div className="px-6 py-5 bg-card/25">
          <h2 className="text-xl font-serif text-foreground leading-snug tracking-tight mb-4">
            {subject || "(no subject)"}
          </h2>
          <div className="flex items-start gap-3.5">
            <SenderAvatar url={email._gravatarUrl} initials={initials} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-foreground truncate">
                  {senderName || senderEmail}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-mono shrink-0">{formattedDate}</p>
              </div>
              {senderName && (
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">{senderEmail}</p>
              )}
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">To: {to}</p>
            </div>
          </div>
        </div>

        {/* AI Features Summary Section */}
        <div className="px-6 py-4 bg-secondary/15 border-b border-border/40">
          {aiLoading ? (
            <div className="space-y-3 p-5 bg-secondary/50 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <RiSparkling2Line className="size-3.5 text-foreground animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-foreground uppercase font-heading">Analyzing with Tsunagu AI...</span>
              </div>
              <Skeleton className="h-4 w-full bg-secondary/60 animate-pulse rounded-md" />
              <Skeleton className="h-3 w-2/3 bg-secondary/40 animate-pulse rounded-md" />
            </div>
          ) : aiData?._rateLimited ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <RiSparkling2Line className="size-3.5" />
              <span>Daily AI limit reached ({aiData.limit} requests/day).</span>
            </div>
          ) : aiData ? (
            <AISummaryCard
              summary={aiData.summary}
              priority={aiData.priority}
              category={aiData.category}
              followUp={aiData.followUp}
              followUpReason={aiData.followUpReason}
              suggestedReplies={aiData.suggestedReplies}
              onSuggestedReplyClick={handleSuggestedReplyClick}
              replyGenerating={replyGenerating}
            />
          ) : (
            <button
              onClick={handleSummarize}
              className="flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-foreground transition-colors cursor-pointer group"
            >
              <RiSparkling2Line className="size-3.5 group-hover:text-foreground" />
              <span className="font-medium">Summarize with AI</span>
            </button>
          )}
        </div>

        {/* Smart Calendar Event Detection Banner */}
        {detected.isLikelyEvent && !showAddEvent && (
          <div className="px-6 py-2 bg-secondary/30 border-b border-border/40 shrink-0 flex items-center justify-between gap-3 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2 min-w-0">
              <RiCalendarEventLine className="size-4 text-foreground/80 shrink-0" />
              <p className="text-xs text-muted-foreground truncate font-medium">
                This email looks like a meeting invite
              </p>
            </div>
            <button
              onClick={openAddEvent}
              className="text-xs text-foreground hover:text-foreground/80 font-bold shrink-0 transition-colors cursor-pointer focus:outline-none"
            >
              Configure Event
            </button>
          </div>
        )}

        {/* Email body */}
        <div className="relative bg-card/10">
          {isHtml ? (
            <iframe
              srcDoc={srcDoc}
              sandbox="allow-same-origin allow-popups"
              className="w-full border-0 bg-transparent block"
              style={{ height: iframeHeight }}
              onLoad={handleIframeLoad}
              title="Email content"
            />
          ) : (
            <div className="px-6 py-6 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {content || "(empty body)"}
            </div>
          )}
        </div>
      </div>

      {/* Add to Calendar panel */}
      {showAddEvent && (
        <div className="bg-card border-t border-border/40 shrink-0 flex flex-col animate-in slide-in-from-bottom-2 duration-150">
          <div className="px-6 pt-4 pb-3 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">
              Schedule Calendar Event
            </p>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-3 py-2 outline-none focus:border-foreground/30 h-10 transition-colors"
              placeholder="Event title"
            />
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-2 py-1.5 outline-none focus:border-foreground/30 h-10 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Start Time</label>
                <input
                  type="time"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-2 py-1.5 outline-none focus:border-foreground/30 h-10 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">End Time</label>
                <input
                  type="time"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-2 py-1.5 outline-none focus:border-foreground/30 h-10 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Select Calendar</label>
              <select
                value={eventCalendar}
                onChange={(e) => setEventCalendar(e.target.value)}
                className="text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-2 outline-none cursor-pointer focus:border-foreground/30 w-full h-10 transition-colors"
              >
                {calendars.length > 0
                  ? calendars.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card">{c.summary ?? c.id}</option>
                    ))
                  : <option value="primary" className="bg-card">My Calendar</option>
                }
              </select>
            </div>
            <textarea
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full text-xs text-foreground bg-secondary/40 border border-border/45 rounded-md px-3 py-2 outline-none focus:border-foreground/30 resize-none transition-colors"
            />
          </div>
          <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between gap-3 bg-secondary/10">
            <button
              onClick={() => setShowAddEvent(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {addStatus === "error" && (
                <span className="text-xs text-rose-500 font-semibold mr-1">Failed to schedule.</span>
              )}
              {addStatus === "success" && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mr-1">
                  <RiCheckLine className="size-4" />
                  Added to Schedule
                </span>
              )}
              <Button
                size="sm"
                onClick={handleAddEvent}
                disabled={addingEvent || !eventTitle.trim() || !eventDate || addStatus === "success"}
                className="gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                <RiCalendarEventLine className="size-3.5" />
                {addingEvent ? "Scheduling" : "Schedule Event"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forward compose panel */}
      {showForward && (
        <div className="bg-card border-t border-border/40 shrink-0 flex flex-col animate-in slide-in-from-bottom-2 duration-150">
          <form onSubmit={handleForward} className="flex flex-col">
            <div className="px-6 pt-3 pb-1.5 space-y-2 shrink-0">
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8 shrink-0 font-heading">
                  To
                </span>
                <input
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  className="flex-1 text-xs text-foreground bg-transparent outline-none"
                  placeholder="recipient@example.com"
                  autoFocus
                />
              </div>
            </div>
            <textarea
              value={forwardBody}
              onChange={(e) => setForwardBody(e.target.value)}
              rows={6}
              className="w-full px-6 py-3 text-xs text-foreground bg-transparent resize-none outline-none leading-relaxed font-mono"
            />
            <div className="px-6 py-3.5 border-t border-border/30 flex items-center justify-between gap-3 bg-secondary/10">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors select-none">
                <RiAttachmentLine className="size-4" />
                <input type="file" multiple onChange={(e) => setForwardFiles(e.target.files)} className="hidden" />
                <span className="text-[11px] font-medium">
                  {forwardFiles && forwardFiles.length > 0 ? `${forwardFiles.length} attached` : "Attach files"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                {forwardStatus === "error" && (
                  <span className="text-xs text-rose-500 font-semibold mr-1">Failed to forward.</span>
                )}
                {forwardStatus === "sent" && (
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mr-1">
                    <RiCheckLine className="size-4" />
                    Forwarded!
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowForward(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1 mr-1 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={forwardSending || !forwardTo.trim() || !forwardBody.trim()}
                  className="gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  <RiSendPlaneLine className="size-3.5" />
                  {forwardSending ? "Forwarding" : "Forward"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Reply compose panel */}
      {showReply && (
        <div className="bg-card border-t border-border/40 shrink-0 flex flex-col animate-in slide-in-from-bottom-2 duration-150">

          {/* Custom AI Drafting Prompt Field inside Compose */}
          <div className="mx-6 mt-3.5 h-10 px-3 bg-secondary/40 border border-border rounded-md flex items-center gap-2">
            <RiSparkling2Fill className="size-3.5 text-muted-foreground shrink-0" />
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCustomAiDraft(); } }}
              placeholder="Tell Tsunagu AI what to write..."
              disabled={replyGenerating}
              className="flex-1 text-xs text-foreground bg-transparent outline-none placeholder:text-muted-foreground/45 h-full"
            />
            <button
              type="button"
              onClick={handleCustomAiDraft}
              disabled={!aiPrompt.trim() || replyGenerating}
              className="text-xs font-semibold text-foreground hover:text-foreground/80 disabled:opacity-35 cursor-pointer"
            >
              {replyGenerating ? "Writing..." : "Write"}
            </button>
          </div>

          <form onSubmit={handleReply} className="flex flex-col">
            <div className="px-6 pt-3 pb-1.5 space-y-2 shrink-0">
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8 shrink-0 font-heading">
                  To
                </span>
                <input
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  className="flex-1 text-xs text-foreground bg-transparent outline-none"
                  placeholder="recipient@example.com"
                />
              </div>
            </div>

            <div className="relative">
              {replyGenerating && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <RiSparkling2Fill className="size-6 text-foreground animate-spin" />
                    <span className="text-xs text-foreground font-semibold">Tsunagu AI is writing reply...</span>
                  </div>
                </div>
              )}
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write your email body..."
                rows={5}
                className="w-full px-6 py-3 text-xs text-foreground bg-transparent resize-none outline-none leading-relaxed"
              />
            </div>

            <div className="px-6 py-3.5 border-t border-border/30 flex items-center justify-between gap-3 bg-secondary/10">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors select-none">
                <RiAttachmentLine className="size-4" />
                <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" />
                <span className="text-[11px] font-medium">
                  {files && files.length > 0 ? `${files.length} attached` : "Attach files"}
                </span>
              </label>

              <div className="flex items-center gap-2">
                {status === "error" && (
                  <span className="text-xs text-rose-500 font-semibold mr-1">Failed to send.</span>
                )}
                {status === "sent" && (
                  <span className="text-xs text-emerald-500 font-semibold mr-1">Sent!</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowReply(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium px-2 py-1 mr-1 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  <RiSendPlaneLine className="size-3.5" />
                  {sending ? "Sending" : "Send Response"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
