"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useCallback, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RiAddLine,
  RiCloseLine,
  RiExternalLinkLine,
  RiGroupLine,
  RiMapPinLine,
} from "@remixicon/react";

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
  htmlLink?: string;
  status?: string;
}

interface CalendarContentProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

// Google Calendar's official color palette (colorId 1–11)
const GCAL_COLORS: Record<string, { hex: string; name: string }> = {
  "1":  { hex: "#7986CB", name: "Lavender" },
  "2":  { hex: "#33B679", name: "Sage" },
  "3":  { hex: "#8E24AA", name: "Grape" },
  "4":  { hex: "#E67C73", name: "Flamingo" },
  "5":  { hex: "#F6BF26", name: "Banana" },
  "6":  { hex: "#F4511E", name: "Tangerine" },
  "7":  { hex: "#039BE5", name: "Peacock" },
  "8":  { hex: "#3F51B5", name: "Blueberry" },
  "9":  { hex: "#0B8043", name: "Basil" },
  "10": { hex: "#D50000", name: "Tomato" },
  "11": { hex: "#616161", name: "Graphite" },
};
const GCAL_DEFAULT = "#4285F4";

function getEventColor(event: CalendarEvent): string {
  return event.colorId ? (GCAL_COLORS[event.colorId]?.hex ?? GCAL_DEFAULT) : GCAL_DEFAULT;
}

// Priority system (stored in localStorage, not Google Calendar)
type Priority = "high" | "medium" | "low";
const PRIORITY: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  low:    { label: "Low",    color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};
const PRIORITY_STORE_KEY = "tsunagu-event-priorities";

function formatTime(dt?: string) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLong(dt?: string, date?: string): string {
  const src = dt ?? (date ? date + "T00:00:00" : undefined);
  if (!src) return "";
  return new Date(src).toLocaleDateString([], {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function parseDescription(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderWithLinks(text: string) {
  const urlRegex = /https?:\/\/[^\s\n]+/g;
  const nodes: (string | JSX.Element)[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const url = m[0];
    const display = url.replace(/^https?:\/\//, "");
    nodes.push(
      <a
        key={m.index}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2 break-all hover:opacity-75"
        onClick={(e) => e.stopPropagation()}
      >
        {display.length > 50 ? display.slice(0, 50) + "…" : display}
      </a>,
    );
    last = m.index + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const RESPONSE_LABELS: Record<string, string> = {
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Maybe",
  needsAction: "Invited",
};

const todayStr = new Date().toISOString().split("T")[0];
const DEFAULT_PANEL_WIDTH = 300;

export default function CalendarContent({
  user,
  gmailConnected,
  calendarConnected,
}: CalendarContentProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailWidth, setDetailWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [priorities, setPriorities] = useState<Record<string, Priority>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(PRIORITY_STORE_KEY) ?? "{}"); }
    catch { return {}; }
  });
  const [form, setForm] = useState({
    title: "",
    date: todayStr,
    startTime: "09:00",
    endTime: "10:00",
    description: "",
    location: "",
    attendees: "",
  });

  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_PANEL_WIDTH);

  // ── Drag-to-resize ──────────────────────────────────────────────────────────
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = detailWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const delta = dragStartX.current - ev.clientX; // left = bigger panel
      setDetailWidth(Math.max(220, Math.min(560, dragStartWidth.current + delta)));
    };
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Priority ─────────────────────────────────────────────────────────────────
  const handlePriorityChange = (eventId: string, priority: Priority | null) => {
    setPriorities((prev) => {
      const next = { ...prev };
      if (priority) next[eventId] = priority;
      else delete next[eventId];
      localStorage.setItem(PRIORITY_STORE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Custom event content (priority dot + badge) ──────────────────────────────
  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const priority = priorities[arg.event.id ?? ""] as Priority | undefined;
      const pc = priority ? PRIORITY[priority] : null;
      const isTimeGrid = arg.view.type.startsWith("timeGrid");

      if (isTimeGrid) {
        return (
          <div className="flex flex-col h-full overflow-hidden px-1 py-0.5 w-full gap-0.5">
            <div className="flex items-center gap-1 min-w-0">
              {pc && (
                <span className="shrink-0 size-1.5 rounded-full" style={{ backgroundColor: pc.color }} />
              )}
              {arg.timeText && (
                <span className="text-[9px] opacity-80 truncate leading-tight">{arg.timeText}</span>
              )}
            </div>
            <span className="text-[11px] font-medium truncate leading-tight">{arg.event.title}</span>
            {pc && (
              <span className="text-[8px] font-bold uppercase leading-tight" style={{ color: pc.color }}>
                {pc.label}
              </span>
            )}
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1 w-full overflow-hidden px-1">
          {pc && (
            <span className="shrink-0 size-1.5 rounded-full" style={{ backgroundColor: pc.color }} />
          )}
          {arg.timeText && (
            <span className="text-[9px] opacity-80 shrink-0">{arg.timeText} </span>
          )}
          <span className="text-[11px] truncate flex-1">{arg.event.title}</span>
          {pc && (
            <span
              className="shrink-0 text-[8px] font-bold px-1 rounded leading-none py-0.5"
              style={{ backgroundColor: pc.bg, color: pc.color }}
            >
              {pc.label[0]}
            </span>
          )}
        </div>
      );
    },
    [priorities],
  );

  // ── Data ──────────────────────────────────────────────────────────────────────
  const loadEvents = async (timeMin: string, timeMax: string) => {
    setLoadingEvents(true);
    try {
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      // silently fail
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDatesSet = (info: DatesSetArg) => {
    loadEvents(info.start.toISOString(), info.end.toISOString());
  };

  const handleSelect = (info: DateSelectArg) => {
    setForm({
      title: "",
      date: info.startStr.split("T")[0],
      startTime: info.startStr.includes("T") ? info.startStr.split("T")[1].slice(0, 5) : "09:00",
      endTime: info.endStr.includes("T")
        ? info.endStr.split("T")[1].slice(0, 5) === "00:00"
          ? "10:00"
          : info.endStr.split("T")[1].slice(0, 5)
        : "10:00",
      description: "",
      location: "",
      attendees: "",
    });
    setShowCreate(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const id = info.event.id;
    setSelectedEvent(
      events.find((e) => e.id === id) ?? (info.event.extendedProps._raw as CalendarEvent),
    );
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const { event } = info;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch(`/api/calendar/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            start: event.allDay
              ? { date: event.startStr.split("T")[0] }
              : { dateTime: event.startStr, timeZone },
            end: event.allDay
              ? { date: event.endStr ? event.endStr.split("T")[0] : event.startStr.split("T")[0] }
              : { dateTime: event.endStr ?? event.startStr, timeZone },
          },
          sendUpdates: "all",
        }),
      });
      if (!res.ok) info.revert();
    } catch { info.revert(); }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const res = await fetch(`/api/calendar/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            start: { dateTime: event.startStr, timeZone },
            end: { dateTime: event.endStr ?? event.startStr, timeZone },
          },
          sendUpdates: "all",
        }),
      });
      if (!res.ok) info.revert();
    } catch { info.revert(); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const attendeeList = form.attendees
        .split(",").map((e) => e.trim()).filter(Boolean).map((email) => ({ email }));
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            summary: form.title,
            description: form.description || undefined,
            location: form.location || undefined,
            start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone },
            end: { dateTime: `${form.date}T${form.endTime}:00`, timeZone },
            attendees: attendeeList.length > 0 ? attendeeList : undefined,
          },
          sendUpdates: "all",
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", date: todayStr, startTime: "09:00", endTime: "10:00", description: "", location: "", attendees: "" });
        const api = calendarRef.current?.getApi();
        if (api) await loadEvents(api.view.activeStart.toISOString(), api.view.activeEnd.toISOString());
      }
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      setSelectedEvent(null);
      const api = calendarRef.current?.getApi();
      if (api) await loadEvents(api.view.activeStart.toISOString(), api.view.activeEnd.toISOString());
    } finally { setDeleting(false); }
  };

  const handleColorChange = async (eventId: string, colorId: string | null) => {
    const newHex = colorId ? (GCAL_COLORS[colorId]?.hex ?? GCAL_DEFAULT) : GCAL_DEFAULT;
    const prevEvents = events;
    const prevSelected = selectedEvent;

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, colorId: colorId ?? undefined } : e)),
    );
    setSelectedEvent((prev) =>
      prev?.id === eventId ? { ...prev, colorId: colorId ?? undefined } : prev,
    );
    const fcEvent = calendarRef.current?.getApi().getEventById(eventId);
    fcEvent?.setProp("backgroundColor", newHex);
    fcEvent?.setProp("borderColor", newHex);

    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: { colorId } }),
      });
      if (!res.ok) throw new Error("api-error");
    } catch {
      setEvents(prevEvents);
      setSelectedEvent(prevSelected);
      const revertHex = prevSelected?.colorId
        ? (GCAL_COLORS[prevSelected.colorId]?.hex ?? GCAL_DEFAULT)
        : GCAL_DEFAULT;
      fcEvent?.setProp("backgroundColor", revertHex);
      fcEvent?.setProp("borderColor", revertHex);
    }
  };

  const fcEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.summary ?? "(No title)",
    start: e.start?.dateTime ?? e.start?.date,
    end: e.end?.dateTime ?? e.end?.date,
    allDay: !e.start?.dateTime,
    backgroundColor: getEventColor(e),
    borderColor: getEventColor(e),
    textColor: "#ffffff",
    extendedProps: { _raw: e },
  }));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Calendar area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Calendar</span>
              {loadingEvents && (
                <span className="size-3.5 rounded-full border border-muted-foreground border-t-transparent animate-spin opacity-60" />
              )}
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <RiAddLine className="size-4" />
              Create Event
            </Button>
          </div>

          {/* FullCalendar */}
          <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
              }}
              buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day", list: "List" }}
              height="100%"
              events={fcEvents}
              editable
              selectable
              selectMirror
              dayMaxEvents
              weekends
              nowIndicator
              datesSet={handleDatesSet}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventContent={renderEventContent}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            />
          </div>
        </div>

        {/* Drag-to-resize handle */}
        {selectedEvent && (
          <div
            className="w-1 shrink-0 hover:bg-primary/30 active:bg-primary/50 cursor-col-resize transition-colors select-none"
            onMouseDown={handleDividerMouseDown}
          />
        )}

        {/* Event detail panel */}
        {selectedEvent && (
          <div
            className="flex flex-col shrink-0 bg-background overflow-hidden border-l"
            style={{ width: detailWidth }}
          >
            {/* Color accent bar */}
            <div className="h-1 w-full shrink-0" style={{ backgroundColor: getEventColor(selectedEvent) }} />

            {/* Header */}
            <div className="flex items-start justify-between px-4 pt-3 pb-2 shrink-0">
              <h2 className="text-sm font-semibold leading-snug line-clamp-2 flex-1 min-w-0 pr-2">
                {selectedEvent.summary ?? "(No title)"}
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
              >
                <RiCloseLine className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Date / time block */}
              <div className="px-4 py-3 border-t border-b bg-muted/30 shrink-0">
                {selectedEvent.start?.dateTime ? (
                  <>
                    <p className="text-xs font-medium">{formatDateLong(selectedEvent.start.dateTime)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(selectedEvent.start.dateTime)}
                      {selectedEvent.end?.dateTime && <> &ndash; {formatTime(selectedEvent.end.dateTime)}</>}
                    </p>
                  </>
                ) : selectedEvent.start?.date ? (
                  <>
                    <p className="text-xs font-medium">{formatDateLong(undefined, selectedEvent.start.date)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">All day</p>
                  </>
                ) : null}
              </div>

              <div className="p-4 space-y-5">
                {/* Priority */}
                {selectedEvent.id && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Priority
                    </p>
                    <div className="flex gap-1.5">
                      {(["high", "medium", "low"] as Priority[]).map((p) => {
                        const cfg = PRIORITY[p];
                        const isActive = priorities[selectedEvent.id!] === p;
                        return (
                          <button
                            key={p}
                            onClick={() => handlePriorityChange(selectedEvent.id!, isActive ? null : p)}
                            className="flex-1 text-[10px] font-semibold py-1.5 rounded-md border transition-all"
                            style={
                              isActive
                                ? { backgroundColor: cfg.bg, borderColor: cfg.color, color: cfg.color }
                                : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                            }
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color picker */}
                {selectedEvent.id && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        title="Default"
                        onClick={() => handleColorChange(selectedEvent.id!, null)}
                        className="size-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                        style={{
                          backgroundColor: GCAL_DEFAULT,
                          boxShadow: !selectedEvent.colorId
                            ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${GCAL_DEFAULT}`
                            : undefined,
                        }}
                      />
                      {Object.entries(GCAL_COLORS).map(([id, { hex, name }]) => (
                        <button
                          key={id}
                          title={name}
                          onClick={() => handleColorChange(selectedEvent.id!, id)}
                          className="size-5 rounded-full transition-transform hover:scale-110 focus:outline-none"
                          style={{
                            backgroundColor: hex,
                            boxShadow:
                              selectedEvent.colorId === id
                                ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${hex}`
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <div className="flex items-start gap-2.5">
                    <RiMapPinLine className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-xs text-foreground leading-relaxed wrap-break-word">
                      {selectedEvent.location}
                    </span>
                  </div>
                )}

                {/* Description with clickable links */}
                {selectedEvent.description && (() => {
                  const parsed = parseDescription(selectedEvent.description);
                  if (!parsed) return null;
                  return (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Description
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {renderWithLinks(parsed)}
                      </p>
                    </div>
                  );
                })()}

                {/* Attendees */}
                {(selectedEvent.attendees?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <RiGroupLine className="size-3" />
                      Guests ({selectedEvent.attendees!.length})
                    </p>
                    <div className="space-y-2">
                      {selectedEvent.attendees!.map((a) => {
                        const initials = (a.displayName ?? a.email ?? "?")
                          .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                        const label = RESPONSE_LABELS[a.responseStatus ?? ""] ?? "Invited";
                        const isAccepted = a.responseStatus === "accepted";
                        const isDeclined = a.responseStatus === "declined";
                        return (
                          <div key={a.email} className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold text-foreground">{initials}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate leading-tight">
                                {a.displayName ?? a.email}
                              </p>
                              {a.displayName && (
                                <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                  {a.email}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                isAccepted
                                  ? "bg-green-500/10 text-green-600"
                                  : isDeclined
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Open in Google Calendar */}
                {selectedEvent.htmlLink && (
                  <a
                    href={selectedEvent.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RiExternalLinkLine className="size-3.5" />
                    Open in Google Calendar
                  </a>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t shrink-0">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={deleting}
                onClick={() => selectedEvent.id && handleDelete(selectedEvent.id)}
              >
                {deleting ? "Deleting..." : "Delete Event"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Create Event</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RiCloseLine className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Input
                placeholder="Event title *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <Input
                  placeholder="Add location (optional)"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Guests</label>
                <Input
                  placeholder="email@example.com, another@example.com"
                  value={form.attendees}
                  onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full min-h-18 text-sm rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Add description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!form.title.trim() || creating}
                onClick={handleCreate}
              >
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
