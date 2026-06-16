"use client";

import { useState, useEffect } from "react";
import {
  RiCalendarEventLine,
  RiExternalLinkLine,
  RiLoaderLine,
  RiCheckLine,
  RiAlertLine,
  RiMapPinLine,
  RiGroupLine,
  RiFileTextLine,
  RiGlobalLine,
  RiTimeLine,
  RiPencilLine,
  RiCloseLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import type { ChatArtifact } from "@/types/ai";

type EventArtifact = Extract<ChatArtifact, { kind: "event" }>;
type CardStatus = "idle" | "editing" | "saving" | "saved" | "error";

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  // datetime-local needs YYYY-MM-DDTHH:MM
  if (iso.length === 10) return `${iso}T00:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  if (!local) return "";
  // datetime-local gives YYYY-MM-DDTHH:MM — add :00 seconds
  return local.length === 16 ? `${local}:00` : local;
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso?: string | null): string {
  if (!iso || iso.length <= 10) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function EventCard({ event }: { event: EventArtifact }) {
  const [summary, setSummary] = useState(event.summary ?? "");
  const [start, setStart] = useState(toDatetimeLocal(event.start));
  const [end, setEnd] = useState(toDatetimeLocal(event.end));
  const [timeZone, setTimeZone] = useState(event.timeZone ?? "Asia/Kolkata");
  const [location, setLocation] = useState(event.location ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [attendees, setAttendees] = useState((event.attendees ?? []).join(", "));
  const [status, setStatus] = useState<CardStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state with streaming props
  useEffect(() => {
    // Only update if we're not actively editing
    if (status !== "editing") {
      setSummary(event.summary ?? "");
      setStart(toDatetimeLocal(event.start));
      setEnd(toDatetimeLocal(event.end));
      setTimeZone(event.timeZone ?? "Asia/Kolkata");
      setLocation(event.location ?? "");
      setDescription(event.description ?? "");
      setAttendees((event.attendees ?? []).join(", "));
      setStatus("idle");
    }
  }, [
    event.summary,
    event.start,
    event.end,
    event.timeZone,
    event.location,
    event.description,
    event.attendees,
    event.eventId,
    status
  ]);

  const canUpdate = !!event.eventId;
  // Show read-only view by default; only show editable fields when user clicks Edit
  const isEditing = status === "editing";
  const locked = status === "idle" || status === "saved";
  const busy = status === "saving";

  function handleStartEdit() {
    if (!canUpdate || busy) return;
    setStatus("editing");
  }

  function handleCancelEdit() {
    // Reset to original values
    setSummary(event.summary ?? "");
    setStart(toDatetimeLocal(event.start));
    setEnd(toDatetimeLocal(event.end));
    setTimeZone(event.timeZone ?? "Asia/Kolkata");
    setLocation(event.location ?? "");
    setDescription(event.description ?? "");
    setAttendees((event.attendees ?? []).join(", "));
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleUpdate() {
    if (!canUpdate || busy) return;
    setStatus("saving");
    setErrorMsg("");
    try {
      const tz = timeZone || "Asia/Kolkata";
      const allDay = !start.includes("T") || start.endsWith("T00:00") && !event.start?.includes("T");
      const startObj = allDay ? { date: start.slice(0, 10) } : { dateTime: toIso(start), timeZone: tz };
      const endObj = allDay ? { date: end.slice(0, 10) } : { dateTime: toIso(end), timeZone: tz };
      const eventBody: Record<string, unknown> = {
        summary,
        start: startObj,
        end: endObj,
      };
      if (location) eventBody.location = location;
      if (description) eventBody.description = description;
      const att = attendees.split(",").map((e) => e.trim()).filter(Boolean);
      if (att.length) eventBody.attendees = att.map((email) => ({ email }));

      const res = await fetch(`/api/calendar/events/${event.eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: "primary", event: eventBody, sendUpdates: "all" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Update failed");
      setStatus("saved");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Something went wrong");
      setStatus("error");
    }
  }  /* ── Accent colors ── */
  const accent = status === "saved"
    ? { stripe: "bg-[#CFE8D6] dark:bg-[#2A3B30]", icon: "text-[#4A7D59] dark:text-[#88B395]", iconBg: "bg-[#F0F8F3] dark:bg-[#1A261F]", badge: "text-[#4A7D59] dark:text-[#88B395] bg-[#F0F8F3] dark:bg-[#1A261F] border-[#D8F0E1] dark:border-[#2A3B30]", dot: "bg-[#4A7D59] dark:bg-[#88B395]" }
    : { stripe: "bg-[#E5E7EB] dark:bg-[#333333]", icon: "text-[#6B7280] dark:text-[#A1A1AA]", iconBg: "bg-[#F9FAFB] dark:bg-[#27272A]", badge: "text-[#6B7280] dark:text-[#A1A1AA] bg-[#F9FAFB] dark:bg-[#27272A] border-[#E5E7EB] dark:border-[#3F3F46]", dot: "bg-[#9CA3AF] dark:bg-[#71717A]" };

  const badgeText = status === "saved" ? "Updated" : event.htmlLink ? "Created" : "Scheduled";

  const inputCls = "w-full text-[13px] text-[#111827] dark:text-[#FAFAF8] bg-[#FAFAF8] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333] rounded-[10px] px-3.5 py-2.5 outline-none focus:border-[#CFE8D6] dark:focus:border-[#2A3B30] focus:ring-2 focus:ring-[#D8F0E1]/50 dark:focus:ring-[#2A3B30]/50 placeholder:text-[#9CA3AF] dark:placeholder:text-[#666666] disabled:opacity-50 transition-all duration-200";

  const startDate = fmtDate(event.start);
  const startTime = fmtTime(event.start);
  const endTime = fmtTime(event.end);
  const hasLocation = !!(event.location);
  const hasAttendees = !!(event.attendees && event.attendees.length > 0);
  const hasDescription = !!(event.description);

  return (
    <div className="mt-4 rounded-[20px] border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#141414] overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col">
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#A1A1AA] uppercase tracking-wide">Calendar Event</span>
             </div>
             
             <div className="flex items-center gap-2 shrink-0">
               <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${accent.badge}`}>
                 <span className={`size-1.5 rounded-full ${accent.dot}`} />
                 {badgeText}
               </span>
               {event.htmlLink && (
                 <a href={event.htmlLink} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border text-[#6B7280] dark:text-[#A1A1AA] bg-[#F9FAFB] dark:bg-[#1A1A1A] border-[#E5E7EB] dark:border-[#333333] hover:text-[#111827] dark:hover:text-[#FAFAF8] transition-colors">
                   <RiExternalLinkLine className="size-3" /> Open
                 </a>
               )}
             </div>
          </div>
          <p className="text-[18px] font-medium text-[#111827] dark:text-[#FAFAF8] leading-snug">{summary || "(No title)"}</p>
        </div>

        {/* ── READ-ONLY CONFIRMATION VIEW ── */}
        {locked && (
          <div className="px-5 pb-5 space-y-4">
            
            {/* Time block — soft elevated surface */}
            <div className="flex flex-col gap-2 p-4 rounded-[16px] bg-[#FAFAF8] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333]">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center min-w-[48px] shrink-0">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1AA] mb-0.5">
                    {startDate ? new Date(event.start!.length <= 10 ? `${event.start}T00:00:00` : event.start!).toLocaleDateString([], { month: "short" }) : "—"}
                  </span>
                  <span className="text-[24px] font-medium text-[#111827] dark:text-[#FAFAF8] leading-none">
                    {startDate ? new Date(event.start!.length <= 10 ? `${event.start}T00:00:00` : event.start!).getDate() : "—"}
                  </span>
                </div>
                
                <div className="w-px h-10 bg-[#E5E7EB] dark:bg-[#333333] shrink-0" />
                
                <div className="flex-1 min-w-0">
                  {startTime ? (
                    <div className="flex items-center gap-2 text-[15px] text-[#111827] dark:text-[#FAFAF8] font-medium mb-1">
                      <span>{startTime}</span>
                      {endTime && (
                        <>
                          <span className="text-[#9CA3AF] dark:text-[#666666]">→</span>
                          <span>{endTime}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-[14px] text-[#111827] dark:text-[#FAFAF8] font-medium mb-1 block">All day</span>
                  )}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-[#A1A1AA]">
                    <RiGlobalLine className="size-3.5 opacity-70" />
                    <span>{event.timeZone || "Asia/Kolkata"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail pills */}
            {(hasLocation || hasAttendees || hasDescription) && (
              <div className="space-y-3 pt-1">
                {hasLocation && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#9CA3AF] dark:text-[#666666] shrink-0"><RiMapPinLine className="size-4" /></div>
                    <span className="text-[13px] text-[#4B5563] dark:text-[#D4D4D8] leading-relaxed">{event.location}</span>
                  </div>
                )}
                {hasAttendees && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#9CA3AF] dark:text-[#666666] shrink-0"><RiGroupLine className="size-4" /></div>
                    <div className="flex flex-wrap gap-1.5">
                      {event.attendees!.map((email, i) => (
                        <span key={i} className="text-[12px] font-medium text-[#4B5563] dark:text-[#D4D4D8] bg-[#F3F4F6] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] rounded-[8px] px-2.5 py-1">{email}</span>
                      ))}
                    </div>
                  </div>
                )}
                {hasDescription && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#9CA3AF] dark:text-[#666666] shrink-0"><RiFileTextLine className="size-4" /></div>
                    <p className="text-[13px] text-[#4B5563] dark:text-[#D4D4D8] leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Event Title</label>
              <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} disabled={busy}
                placeholder="Event title" className={`${inputCls} font-medium text-[14px]`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Start</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} disabled={busy} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">End</label>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} disabled={busy} className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Timezone</label>
              <input type="text" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} disabled={busy}
                placeholder="Asia/Kolkata" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} disabled={busy}
                placeholder="Add location" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Guests</label>
              <input type="text" value={attendees} onChange={(e) => setAttendees(e.target.value)} disabled={busy}
                placeholder="email1@example.com, email2@example.com" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6B7280] dark:text-[#A1A1AA]">Notes</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} rows={3}
                placeholder="Add notes or description" className={`${inputCls} resize-none`} />
            </div>
          </div>
        )}

        {/* ── Saving state ── */}
        {busy && (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2.5 text-[13px] text-[#4B5563] dark:text-[#D4D4D8] px-4 py-3 rounded-[12px] bg-[#FAFAF8] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#333333]">
              <RiLoaderLine className="size-4 animate-spin text-[#4A7D59] dark:text-[#88B395]" />
              <span className="font-medium">Syncing changes...</span>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="mx-5 mb-4 flex items-center gap-2.5 text-[13px] text-[#B91C1C] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#451A1A] border border-[#FECACA] dark:border-[#7F1D1D] rounded-[12px] px-4 py-3">
            <RiAlertLine className="size-4 shrink-0" />
            <span className="font-medium">{errorMsg || "Failed. Please try again."}</span>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="px-5 pb-5 flex items-center gap-2.5">
          {locked && canUpdate && (
            <>
              <button onClick={handleStartEdit}
                className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium rounded-[10px] text-[#111827] dark:text-[#FAFAF8] bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#333333] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1A] shadow-sm transition-all duration-200 cursor-pointer">
                Edit event
              </button>
              <span className="text-[12px] text-[#9CA3AF] dark:text-[#666666] font-medium ml-2">Synced with Google Calendar</span>
            </>
          )}

          {isEditing && (
            <>
              <button onClick={handleUpdate} disabled={busy || !summary.trim()}
                className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium rounded-[10px] bg-[#111827] dark:bg-[#FAFAF8] text-white dark:text-[#111827] hover:bg-[#374151] dark:hover:bg-[#E5E7EB] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm">
                {busy ? "Updating..." : "Save changes"}
              </button>
              <button onClick={handleCancelEdit}
                className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium rounded-[10px] text-[#111827] dark:text-[#FAFAF8] bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#333333] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1A] shadow-sm transition-all duration-200 cursor-pointer">
                Cancel
              </button>
            </>
          )}

          {status === "error" && (
            <button onClick={() => setStatus("editing")}
              className="inline-flex items-center justify-center h-8 px-4 text-[13px] font-medium rounded-[10px] text-[#111827] dark:text-[#FAFAF8] bg-white dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#333333] hover:bg-[#F9FAFB] dark:hover:bg-[#1A1A1A] shadow-sm transition-all duration-200 cursor-pointer">
              Try Again
            </button>
          )}
        </div>

        {!canUpdate && status === "idle" && (
          <div className="px-5 pb-4 pt-1">
            <span className="text-[12px] text-[#9CA3AF] dark:text-[#666666] font-medium">Event created. You can open it to edit.</span>
          </div>
        )}
      </div>
    </div>
  );
}
