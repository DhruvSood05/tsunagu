"use client";
import { useEffect, useMemo, useState } from "react";
import { getHeader, decodeEmailBody } from "@/lib/email";
import { detectEventFromEmail } from "@/lib/event-detect";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RiArrowLeftLine,
  RiReplyLine,
  RiDeleteBinLine,
  RiAttachmentLine,
  RiSendPlaneLine,
  RiCalendarEventLine,
  RiCheckLine,
} from "@remixicon/react";

interface EmailDetailProps {
  email: any;
  onClose: () => void;
  onDelete: () => void;
}

interface CalendarOption {
  id: string;
  summary?: string;
}

const EMAIL_STYLES = `
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 16px 20px;
      word-break: break-word;
    }
    a { color: #2563eb; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #d1d5db; margin: 8px 0; padding: 4px 12px; color: #6b7280; }
    pre, code { font-size: 13px; background: #f3f4f6; border-radius: 4px; padding: 2px 4px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 6px 8px; }
  </style>
`;

function SenderAvatar({ url, initials }: { url?: string; initials: string }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={initials}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="size-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-muted-foreground leading-none">{initials}</span>
    </div>
  );
}

export default function EmailDetail({ email, onClose, onDelete }: EmailDetailProps) {
  const [showReply, setShowReply] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [replyTo, setReplyTo] = useState(getHeader(email, "From"));
  const [replyBody, setReplyBody] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setShowAddEvent(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/emails/${email.id}`, { method: "DELETE" });
    onDelete();
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

  const srcDoc = isHtml
    ? `<!DOCTYPE html><html><head><meta charset="utf-8">${EMAIL_STYLES}</head><body>${content}</body></html>`
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Back">
          <RiArrowLeftLine />
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            variant={showAddEvent ? "secondary" : "outline"}
            size="sm"
            onClick={showAddEvent ? () => setShowAddEvent(false) : openAddEvent}
            className="gap-1.5"
            title="Add to Calendar"
          >
            <RiCalendarEventLine className="size-3.5" />
            {detected.isLikelyEvent ? "Add to Calendar" : "Add to Calendar"}
          </Button>
          <Button
            variant={showReply ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setShowReply(!showReply); setShowAddEvent(false); }}
            className="gap-1.5"
          >
            <RiReplyLine className="size-3.5" />
            Reply
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            <RiDeleteBinLine className="size-3.5" />
            {deleting ? "Deleting…" : "Trash"}
          </Button>
        </div>
      </div>

      {/* Email header */}
      <div className="px-6 pt-5 pb-4 border-b shrink-0">
        <h2 className="text-base font-semibold text-foreground leading-snug mb-4">
          {subject || "(no subject)"}
        </h2>
        <div className="flex items-start gap-3">
          <SenderAvatar url={email._gravatarUrl} initials={initials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">
                {senderName || senderEmail}
              </p>
              <p className="text-[10px] text-muted-foreground shrink-0">{formattedDate}</p>
            </div>
            {senderName && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{senderEmail}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">To: {to}</p>
          </div>
        </div>
      </div>

      {/* Smart detection banner */}
      {detected.isLikelyEvent && !showAddEvent && (
        <div className="px-4 py-2 bg-primary/5 border-b shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <RiCalendarEventLine className="size-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              This email looks like a meeting invite
            </p>
          </div>
          <button
            onClick={openAddEvent}
            className="text-xs text-primary font-medium hover:underline shrink-0"
          >
            Add to Calendar
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {isHtml ? (
          <iframe
            srcDoc={srcDoc}
            sandbox="allow-same-origin allow-popups"
            className="w-full h-full border-0"
            title="Email content"
          />
        ) : (
          <div className="h-full overflow-y-auto px-6 py-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {content || "(empty)"}
          </div>
        )}
      </div>

      {/* Add to Calendar panel */}
      {showAddEvent && (
        <>
          <Separator />
          <div className="bg-background shrink-0 flex flex-col">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-3">
                Add to Calendar
              </p>

              {/* Title */}
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full text-xs text-foreground outline-none bg-transparent border-b border-border pb-2 mb-2"
                placeholder="Event title"
              />

              {/* Date + Times */}
              <div className="flex gap-2 mb-2">
                <div className="flex flex-col gap-0.5 flex-1">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="text-xs text-foreground outline-none bg-transparent border-b border-border pb-1"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Start</label>
                  <input
                    type="time"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="text-xs text-foreground outline-none bg-transparent border-b border-border pb-1"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-widest">End</label>
                  <input
                    type="time"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="text-xs text-foreground outline-none bg-transparent border-b border-border pb-1"
                  />
                </div>
              </div>

              {/* Calendar picker */}
              <div className="flex flex-col gap-0.5 mb-2">
                <label className="text-[9px] text-muted-foreground uppercase tracking-widest">Calendar</label>
                <select
                  value={eventCalendar}
                  onChange={(e) => setEventCalendar(e.target.value)}
                  className="text-xs text-foreground outline-none bg-background border-b border-border pb-1 w-full cursor-pointer"
                >
                  {calendars.length > 0
                    ? calendars.map((c) => (
                        <option key={c.id} value={c.id}>{c.summary ?? c.id}</option>
                      ))
                    : <option value="primary">My Calendar</option>
                  }
                </select>
              </div>

              {/* Description */}
              <textarea
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full text-xs text-foreground outline-none bg-transparent border-b border-border pb-1 mb-1 resize-none"
              />
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {addStatus === "error" && (
                  <span className="text-xs text-destructive">Failed to add.</span>
                )}
                {addStatus === "success" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <RiCheckLine className="size-3.5" />
                    Added!
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={handleAddEvent}
                  disabled={addingEvent || !eventTitle.trim() || !eventDate || addStatus === "success"}
                  className="gap-1.5"
                >
                  <RiCalendarEventLine className="size-3.5" />
                  {addingEvent ? "Adding…" : "Add Event"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reply form */}
      {showReply && (
        <>
          <Separator />
          <form onSubmit={handleReply} className="bg-background shrink-0 flex flex-col">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                Reply
              </p>
              <input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="w-full text-xs text-foreground outline-none bg-transparent border-b border-border pb-2 mb-2"
                placeholder="To"
              />
            </div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply…"
              rows={4}
              className="px-4 py-2 text-sm text-foreground resize-none outline-none bg-transparent"
            />
            <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <RiAttachmentLine className="size-3.5" />
                <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" />
                {files && files.length > 0 ? `${files.length} file(s)` : "Attach"}
              </label>
              <div className="flex items-center gap-2">
                {status === "error" && (
                  <span className="text-xs text-destructive">Failed to send.</span>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !replyBody.trim()}
                  className="gap-1.5"
                >
                  <RiSendPlaneLine className="size-3.5" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
