"use client";

import React from "react";
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
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiExternalLinkLine,
  RiGroupLine,
  RiMapPinLine,
  RiPencilLine,
  RiTimeLine,
} from "@remixicon/react";

// ── Types ────────────────────────────────────────────────────────────────────

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
  _calendarId?: string;
}

interface CalendarInfo {
  id: string;
  summary?: string;
  color: string;
}

interface CalendarContentProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";
type Priority = "high" | "medium" | "low";

// ── Constants ────────────────────────────────────────────────────────────────

const CALENDAR_PALETTE = [
  "#4285F4", "#0B8043", "#D50000", "#F6BF26", "#8E24AA",
  "#E67C73", "#F4511E", "#039BE5", "#33B679", "#7986CB", "#616161",
];

const COLOR_SWATCHES = [
  "#4285F4", "#7986CB", "#33B679", "#8E24AA", "#E67C73",
  "#F6BF26", "#F4511E", "#039BE5", "#3F51B5", "#0B8043", "#D50000", "#616161",
];

const COLORS_KEY = "tsunagu-calendar-colors";

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

const PRIORITY: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  low:    { label: "Low",    color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};
const PRIORITY_KEY = "tsunagu-event-priorities";

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "dayGridMonth",  label: "Month" },
  { key: "timeGridWeek",  label: "Week"  },
  { key: "timeGridDay",   label: "Day"   },
  { key: "listWeek",      label: "List"  },
];

const RESPONSE_LABELS: Record<string, string> = {
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Maybe",
  needsAction: "Invited",
};

const DEFAULT_PANEL_WIDTH = 340;
const todayStr = new Date().toISOString().split("T")[0];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEventColor(e: CalendarEvent, calendarColor?: string) {
  return e.colorId ? (GCAL_COLORS[e.colorId]?.hex ?? GCAL_DEFAULT) : (calendarColor ?? GCAL_DEFAULT);
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function localDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function localTimeStr(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

function formatTime(dt?: string) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateMed(dt?: string, date?: string) {
  const src = dt ?? (date ? date + "T00:00:00" : undefined);
  if (!src) return "";
  return new Date(src).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function parseDescription(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function renderWithLinks(text: string) {
  const urlRegex = /https?:\/\/[^\s\n]+/g;
  const nodes: (string | React.JSX.Element)[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const url = m[0];
    const display = url.replace(/^https?:\/\//, "");
    nodes.push(
      <a key={m.index} href={url} target="_blank" rel="noreferrer"
        className="text-primary underline underline-offset-2 break-all hover:opacity-75"
        onClick={(e) => e.stopPropagation()}>
        {display.length > 48 ? display.slice(0, 48) + "…" : display}
      </a>,
    );
    last = m.index + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CalendarContent({ user, gmailConnected, calendarConnected }: CalendarContentProps) {
  // data
  const [events,       setEvents]       = useState<CalendarEvent[]>([]);
  const [loading,      setLoading]      = useState(false);
  // detail panel
  const [selected,     setSelected]     = useState<CalendarEvent | null>(null);
  const [editMode,     setEditMode]     = useState(false);
  const [editForm,     setEditForm]     = useState({ title: "", date: "", startTime: "", endTime: "", location: "", description: "", attendees: "", calendarId: "primary" });
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [panelWidth,   setPanelWidth]   = useState(DEFAULT_PANEL_WIDTH);
  // inline notes editing
  const [notesValue,   setNotesValue]   = useState("");
  const [notesSaving,  setNotesSaving]  = useState(false);
  // create modal
  const [showCreate,   setShowCreate]   = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [form,         setForm]         = useState({ title: "", date: todayStr, startTime: "09:00", endTime: "10:00", location: "", attendees: "", description: "", allDay: false, calendarId: "primary" });
  // priorities
  const [priorities,   setPriorities]   = useState<Record<string, Priority>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(PRIORITY_KEY) ?? "{}"); } catch { return {}; }
  });
  // toolbar
  const [view,         setView]         = useState<CalendarView>("dayGridMonth");
  const [title,        setTitle]        = useState("");
  // calendars sidebar
  const [calendars,    setCalendars]    = useState<CalendarInfo[]>([]);
  const [enabledCals,  setEnabledCals]  = useState<Set<string>>(new Set());
  const [calColors,    setCalColors]    = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(COLORS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  // Sync inline notes when selected event changes
  useEffect(() => {
    setNotesValue(selected?.description ? parseDescription(selected.description) : "");
  }, [selected?.id]);

  const calendarRef  = useRef<InstanceType<typeof FullCalendar>>(null);
  const dragStartX   = useRef(0);
  const dragStartW   = useRef(DEFAULT_PANEL_WIDTH);
  const dateRange    = useRef<{ min: string; max: string } | null>(null);
  const api = () => calendarRef.current?.getApi();

  // ── Load calendar list on mount ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/calendar/calendars")
      .then((r) => r.json())
      .then(({ calendars: raw = [] }: { calendars: { id: string; summary?: string }[] }) => {
        const list: CalendarInfo[] = raw.map((c, i) => ({
          id:      c.id,
          summary: c.summary,
          color:   calColors[c.id] ?? CALENDAR_PALETTE[i % CALENDAR_PALETTE.length],
        }));
        const enabled = new Set(list.map((c) => c.id));
        setCalendars(list);
        setEnabledCals(enabled);
        if (list.length > 0) setForm((f) => ({ ...f, calendarId: list[0].id }));
        if (dateRange.current) {
          loadEvents(dateRange.current.min, dateRange.current.max, enabled);
        }
      })
      .catch(() => {
        const fallback: CalendarInfo[] = [{ id: "primary", summary: "My Calendar", color: GCAL_DEFAULT }];
        const enabled = new Set(["primary"]);
        setCalendars(fallback);
        setEnabledCals(enabled);
        if (dateRange.current) {
          loadEvents(dateRange.current.min, dateRange.current.max, enabled);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drag-to-resize panel ─────────────────────────────────────────────────
  const onDividerDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartW.current = panelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) =>
      setPanelWidth(Math.max(280, Math.min(560, dragStartW.current + dragStartX.current - ev.clientX)));
    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Calendar toggle ───────────────────────────────────────────────────────
  const toggleCalendar = (id: string) => {
    setEnabledCals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const a = api();
      if (a) loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString(), next);
      return next;
    });
  };

  // ── Calendar color ────────────────────────────────────────────────────────
  const applyCalColor = (calId: string, hex: string) => {
    setCalColors((prev) => {
      const next = { ...prev, [calId]: hex };
      localStorage.setItem(COLORS_KEY, JSON.stringify(next));
      return next;
    });
    setCalendars((prev) => prev.map((c) => c.id === calId ? { ...c, color: hex } : c));
    setColorPickerFor(null);
  };

  // ── Priority ─────────────────────────────────────────────────────────────
  const setPriority = (id: string, p: Priority | null) => {
    setPriorities((prev) => {
      const next = { ...prev };
      if (p) next[id] = p; else delete next[id];
      localStorage.setItem(PRIORITY_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Custom event content ──────────────────────────────────────────────────
  const renderEventContent = useCallback((arg: EventContentArg) => {
    const p = priorities[arg.event.id ?? ""] as Priority | undefined;
    const pc = p ? PRIORITY[p] : null;
    const isTime = arg.view.type.startsWith("timeGrid");

    if (isTime) {
      return (
        <div className="flex flex-col h-full overflow-hidden px-2 py-1 w-full">
          <div className="flex items-center gap-1 min-w-0">
            {pc && <span className="shrink-0 size-1 rounded-full" style={{ backgroundColor: pc.color }} />}
            {arg.timeText && <span className="text-[9px] opacity-60 truncate font-medium">{arg.timeText}</span>}
          </div>
          <span className="text-[11px] font-semibold truncate leading-tight mt-0.5 tracking-tight">{arg.event.title}</span>
          {pc && <span className="text-[8px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: pc.color }}>{pc.label}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 w-full overflow-hidden px-1.5">
        {pc && <span className="shrink-0 size-1.5 rounded-full" style={{ backgroundColor: pc.color }} />}
        {arg.timeText && <span className="text-[9px] opacity-60 shrink-0 font-medium">{arg.timeText} </span>}
        <span className="text-[11px] font-medium truncate flex-1 tracking-tight">{arg.event.title}</span>
        {pc && (
          <span className="shrink-0 text-[8px] font-semibold px-1 py-0.5 rounded-sm leading-none"
            style={{ backgroundColor: pc.bg, color: pc.color }}>{pc.label[0]}</span>
        )}
      </div>
    );
  }, [priorities]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const loadEvents = async (min: string, max: string, calIds?: Set<string>) => {
    setLoading(true);
    try {
      const ids = [...(calIds ?? enabledCals)];
      if (ids.length === 0) { setEvents([]); return; }
      const url = `/api/calendar/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&calendarIds=${encodeURIComponent(ids.join(","))}`;
      const res = await fetch(url);
      if (res.ok) setEvents((await res.json()).events ?? []);
    } finally { setLoading(false); }
  };

  const handleDatesSet = (info: DatesSetArg) => {
    const min = info.start.toISOString();
    const max = info.end.toISOString();
    dateRange.current = { min, max };
    setTitle(info.view.title);
    setView(info.view.type as CalendarView);
    if (enabledCals.size > 0) loadEvents(min, max);
  };

  const handleSelect = (info: DateSelectArg) => {
    const startT = localTimeStr(info.start);
    const endT   = localTimeStr(info.end);
    setForm({
      title: "", date: localDateStr(info.start),
      startTime: info.allDay ? "09:00" : startT,
      endTime:   info.allDay ? "10:00" : (endT === "00:00" ? "10:00" : endT),
      location: "", attendees: "", description: "",
      allDay: info.allDay,
      calendarId: calendars[0]?.id ?? "primary",
    });
    setShowCreate(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    setSelected(events.find((e) => e.id === info.event.id) ?? (info.event.extendedProps._raw as CalendarEvent));
    setEditMode(false);
  };

  const handleDrop = async (info: EventDropArg) => {
    const { event } = info;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch(`/api/calendar/events/${event.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: {
        start: event.allDay ? { date: event.startStr.split("T")[0] } : { dateTime: event.startStr, timeZone: tz },
        end:   event.allDay ? { date: event.endStr ? event.endStr.split("T")[0] : event.startStr.split("T")[0] } : { dateTime: event.endStr ?? event.startStr, timeZone: tz },
      }, sendUpdates: "all" }),
    }).catch(() => null);
    if (!res?.ok) info.revert();
  };

  const handleResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch(`/api/calendar/events/${event.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: { start: { dateTime: event.startStr, timeZone: tz }, end: { dateTime: event.endStr ?? event.startStr, timeZone: tz } }, sendUpdates: "all" }),
    }).catch(() => null);
    if (!res?.ok) info.revert();
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const guests = form.attendees.split(",").map((s) => s.trim()).filter(Boolean).map((email) => ({ email }));
      const res = await fetch("/api/calendar/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: form.calendarId || undefined,
          event: {
            summary: form.title,
            location: form.location || undefined,
            description: form.description || undefined,
            start: form.allDay ? { date: form.date } : { dateTime: `${form.date}T${form.startTime}:00`, timeZone: tz },
            end:   form.allDay ? { date: form.date } : { dateTime: `${form.date}T${form.endTime}:00`,   timeZone: tz },
            attendees: guests.length ? guests : undefined,
          },
          sendUpdates: "all",
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", date: todayStr, startTime: "09:00", endTime: "10:00", location: "", attendees: "", description: "", allDay: false, calendarId: calendars[0]?.id ?? "primary" });
        const a = api();
        if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
      }
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      setSelected(null);
      const a = api();
      if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
    } finally { setDeleting(false); }
  };

  const startEdit = (ev: CalendarEvent) => {
    const s = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
    const e = ev.end?.dateTime   ? new Date(ev.end.dateTime)   : null;
    setEditForm({
      title: ev.summary ?? "",
      date: s ? localDateStr(s) : (ev.start?.date ?? ""),
      startTime: s ? localTimeStr(s) : "09:00",
      endTime:   e ? localTimeStr(e) : "10:00",
      location: ev.location ?? "",
      description: ev.description ? parseDescription(ev.description) : "",
      attendees: ev.attendees?.map((a) => a.email ?? "").join(", ") ?? "",
      calendarId: ev._calendarId ?? calendars[0]?.id ?? "primary",
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selected?.id || !editForm.title.trim()) return;
    setSaving(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isAllDay = !selected.start?.dateTime;
      const guests = editForm.attendees.split(",").map((s) => s.trim()).filter(Boolean).map((email) => ({ email }));
      const patch = {
        summary: editForm.title,
        location: editForm.location || undefined,
        description: editForm.description || undefined,
        start: isAllDay ? { date: editForm.date } : { dateTime: `${editForm.date}T${editForm.startTime}:00`, timeZone: tz },
        end:   isAllDay ? { date: editForm.date } : { dateTime: `${editForm.date}T${editForm.endTime}:00`,   timeZone: tz },
        attendees: guests.length ? guests : undefined,
      };
      const calendarMoved = editForm.calendarId && editForm.calendarId !== selected._calendarId;
      if (calendarMoved) {
        await fetch(`/api/calendar/events/${selected.id}?calendarId=${encodeURIComponent(selected._calendarId ?? "primary")}`, { method: "DELETE" });
        await fetch("/api/calendar/events", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarId: editForm.calendarId, event: patch, sendUpdates: "all" }),
        });
        setSelected(null);
        setEditMode(false);
        const a = api();
        if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
        return;
      }

      const res = await fetch(`/api/calendar/events/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: selected._calendarId, event: patch, sendUpdates: "all" }),
      });
      if (!res.ok) return;
      const updated: CalendarEvent = (await res.json()).event ?? { ...selected, ...patch };
      setEvents((prev) => prev.map((e) => (e.id === selected.id ? updated : e)));
      setSelected(updated);
      const fc = api()?.getEventById(selected.id);
      if (fc) {
        fc.setProp("title", editForm.title);
        if (!isAllDay) { fc.setStart(`${editForm.date}T${editForm.startTime}:00`); fc.setEnd(`${editForm.date}T${editForm.endTime}:00`); }
      }
      setEditMode(false);
    } finally { setSaving(false); }
  };

  // Build a clean event body for updates — strips read-only Google Calendar fields
  // that cause events.update to fail (etag, kind, created, self, organizer, etc.)
  const buildEventBody = (e: CalendarEvent, overrides: Record<string, any> = {}) => {
    const cleanDt = (dt: CalendarEvent["start"]) => {
      if (!dt) return undefined;
      if (dt.date) return { date: dt.date };
      return { dateTime: dt.dateTime, ...(dt.timeZone ? { timeZone: dt.timeZone } : {}) };
    };
    const cleanAttendees = (e.attendees as any[])
      ?.map((a) => ({
        email: a.email,
        ...(a.displayName ? { displayName: a.displayName } : {}),
        ...(a.responseStatus ? { responseStatus: a.responseStatus } : {}),
      }))
      .filter((a) => a.email);

    const body: Record<string, any> = {
      summary: e.summary,
      start:   cleanDt(e.start),
      end:     cleanDt(e.end),
    };
    if (e.description)                     body.description = e.description;
    if (e.location)                        body.location    = e.location;
    if (cleanAttendees?.length)            body.attendees   = cleanAttendees;
    if (e.colorId)                         body.colorId     = e.colorId;
    return { ...body, ...overrides };
  };

  const handleColorChange = async (id: string, colorId: string | null) => {
    const eventForId  = events.find((e) => e.id === id);
    if (!eventForId) return;
    const calColor    = (eventForId._calendarId ? calColorMap[eventForId._calendarId] : undefined) ?? GCAL_DEFAULT;
    const newBg       = colorId ? (GCAL_COLORS[colorId]?.hex ?? GCAL_DEFAULT) : calColor;
    const prevEvents  = events;
    const prevSelected = selected;

    setEvents((p) => p.map((e) => (e.id === id ? { ...e, colorId: colorId ?? undefined } : e)));
    setSelected((p) => p?.id === id ? { ...p, colorId: colorId ?? undefined } : p);
    const fc = api()?.getEventById(id);
    fc?.setProp("backgroundColor", newBg);

    try {
      // colorId override: set specific color, or omit entirely to reset to calendar default
      const overrides = colorId ? { colorId } : { colorId: undefined };
      const eventBody = buildEventBody(eventForId, overrides);
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: eventForId._calendarId ?? "primary", event: eventBody }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEvents(prevEvents); setSelected(prevSelected);
      const revertBg = prevSelected?.colorId
        ? (GCAL_COLORS[prevSelected.colorId]?.hex ?? GCAL_DEFAULT)
        : calColor;
      fc?.setProp("backgroundColor", revertBg);
    }
  };

  const handleNotesSave = async () => {
    if (!selected?.id) return;
    const current = selected.description ? parseDescription(selected.description) : "";
    if (notesValue === current) return;
    setNotesSaving(true);
    try {
      const eventBody = buildEventBody(selected, { description: notesValue || undefined });
      const res = await fetch(`/api/calendar/events/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: selected._calendarId ?? "primary",
          event: eventBody,
          sendUpdates: "none",
        }),
      });
      if (res.ok) {
        setSelected((p) => p ? { ...p, description: notesValue } : p);
        setEvents((prev) => prev.map((e) => e.id === selected.id ? { ...e, description: notesValue } : e));
      }
    } finally {
      setNotesSaving(false);
    }
  };

  const calColorMap = Object.fromEntries(calendars.map((c) => [c.id, c.color]));

  const fcEvents: EventInput[] = events.map((e) => {
    const calColor  = (e._calendarId ? calColorMap[e._calendarId] : undefined) ?? GCAL_DEFAULT;
    const bgColor   = e.colorId ? (GCAL_COLORS[e.colorId]?.hex ?? GCAL_DEFAULT) : calColor;
    return {
      id: e.id,
      title: e.summary ?? "(No title)",
      start: e.start?.dateTime ?? e.start?.date,
      end:   e.end?.dateTime   ?? e.end?.date,
      allDay: !e.start?.dateTime,
      backgroundColor: bgColor,
      borderColor:     calColor,
      textColor: "#ffffff",
      extendedProps: { _raw: e, _calendarColor: calColor, _hasOwnColor: !!e.colorId },
    };
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-5 h-[52px] border-b border-border/50 shrink-0 gap-4 bg-background">
          {/* Left: navigation */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => api()?.prev()}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150 active:scale-95"
              >
                <RiArrowLeftSLine className="size-4" />
              </button>
              <button
                onClick={() => api()?.next()}
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-150 active:scale-95"
              >
                <RiArrowRightSLine className="size-4" />
              </button>
            </div>
            <button
              onClick={() => api()?.today()}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 h-6 rounded-lg border border-border/60 hover:border-border hover:bg-muted/50 transition-all duration-150"
            >
              Today
            </button>
            <h1 className="text-[13px] font-semibold text-foreground tracking-tight truncate">{title}</h1>
            {loading && (
              <div className="size-3.5 rounded-full border-[1.5px] border-muted-foreground/25 border-t-muted-foreground/70 animate-spin shrink-0" />
            )}
          </div>

          {/* Right: view switcher + new event */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center bg-muted/60 rounded-xl p-1 gap-0.5">
              {VIEWS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { api()?.changeView(key); setView(key); }}
                  className={`text-[11px] font-medium px-3 h-6 rounded-lg transition-all duration-150 ${
                    view === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 h-7 px-3.5 bg-foreground text-background text-[11px] font-medium rounded-full hover:opacity-90 active:scale-95 transition-all duration-150 shrink-0"
            >
              <RiAddLine className="size-3" />
              New Event
            </button>
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden min-w-0">

          {/* ── Calendars sidebar ─────────────────────────────────────────── */}
          <div className="w-[200px] shrink-0 border-r border-border/50 flex flex-col overflow-y-auto bg-background">
            <div className="px-4 pt-5 pb-3">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/45 mb-3 px-1">
                Calendars
              </p>
              {calendars.length === 0 ? (
                <div className="space-y-2 px-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-muted/50 animate-pulse rounded-md" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {calendars.map((cal) => {
                    const on = enabledCals.has(cal.id);
                    const pickerOpen = colorPickerFor === cal.id;
                    return (
                      <li key={cal.id}>
                        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-all duration-100 group cursor-pointer">
                          <button
                            type="button"
                            onClick={() => toggleCalendar(cal.id)}
                            className="size-3 shrink-0 rounded-sm transition-all"
                            style={{
                              backgroundColor: on ? cal.color : "transparent",
                              border: `2px solid ${cal.color}`,
                              opacity: on ? 1 : 0.5,
                            }}
                          />
                          <span
                            className="text-[12px] truncate flex-1 font-medium transition-colors select-none"
                            style={{ color: on ? "var(--foreground)" : "var(--muted-foreground)" }}
                            onClick={() => toggleCalendar(cal.id)}
                          >
                            {cal.summary ?? cal.id}
                          </span>
                          <button
                            type="button"
                            title="Change color"
                            onClick={() => setColorPickerFor(pickerOpen ? null : cal.id)}
                            className="size-5 shrink-0 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-muted/80 transition-all text-muted-foreground"
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3">
                              <circle cx="8" cy="8" r="2.5" />
                              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l1.41-1.41M3.05 12.95l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                            </svg>
                          </button>
                        </div>

                        {pickerOpen && (
                          <div className="mx-2 mb-2 mt-0.5">
                            <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/40 rounded-lg border border-border/40">
                              {COLOR_SWATCHES.map((hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  title={hex}
                                  onClick={() => applyCalColor(cal.id, hex)}
                                  className="size-4 rounded-full transition-all hover:scale-110 focus:outline-none"
                                  style={{
                                    backgroundColor: hex,
                                    boxShadow: cal.color === hex ? `0 0 0 2px var(--background), 0 0 0 3.5px ${hex}` : undefined,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* ── Calendar grid ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden min-w-0 p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              height="100%"
              events={fcEvents}
              editable selectable selectMirror dayMaxEvents weekends nowIndicator
              datesSet={handleDatesSet}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleDrop}
              eventResize={handleResize}
              eventContent={renderEventContent}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              dayHeaderFormat={{ weekday: "short" }}
            />
          </div>

          {/* Drag handle */}
          {selected && (
            <div
              className="w-px shrink-0 bg-border/40 hover:bg-primary/25 cursor-col-resize transition-colors select-none"
              style={{ cursor: "col-resize" }}
              onMouseDown={onDividerDown}
            />
          )}

          {/* ── Detail panel ─────────────────────────────────────────────── */}
          {selected && (
            <div
              className="flex flex-col shrink-0 bg-background overflow-hidden"
              style={{ width: panelWidth }}
            >
              {/* Calendar color accent bar */}
              <div
                className="h-[3px] w-full shrink-0 opacity-80"
                style={{ backgroundColor: selected._calendarId ? (calColorMap[selected._calendarId] ?? GCAL_DEFAULT) : GCAL_DEFAULT }}
              />

              {/* Panel header */}
              <div className="flex items-start gap-2 px-5 pt-4 pb-3 border-b border-border/40 shrink-0">
                {editMode ? (
                  <input
                    autoFocus
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Event title"
                    className="flex-1 min-w-0 text-[13px] font-semibold bg-transparent border-b-2 border-muted focus:border-foreground focus:outline-none pb-0.5 transition-colors placeholder:text-muted-foreground/35"
                  />
                ) : (
                  <h2 className="flex-1 min-w-0 text-[13px] font-semibold leading-snug line-clamp-2 text-foreground tracking-tight">
                    {selected.summary ?? "(No title)"}
                  </h2>
                )}
                <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                  {!editMode && (
                    <button
                      onClick={() => startEdit(selected)}
                      className="size-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
                      title="Edit"
                    >
                      <RiPencilLine className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(null); setEditMode(false); }}
                    className="size-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
                  >
                    <RiCloseLine className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">

                {/* Date / time */}
                <div className="px-5 py-3.5 border-b border-border/30">
                  {editMode ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <RiCalendarEventLine className="size-3.5 text-muted-foreground/60 shrink-0" />
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                          className="flex-1 text-[12px] bg-muted/40 rounded-lg px-2.5 h-7 border border-border/40 focus:border-foreground/25 focus:outline-none transition-colors"
                        />
                      </div>
                      {selected.start?.dateTime && (
                        <div className="flex items-center gap-3">
                          <RiTimeLine className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={editForm.startTime}
                              onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                              className="flex-1 text-[12px] bg-muted/40 rounded-lg px-2.5 h-7 border border-border/40 focus:border-foreground/25 focus:outline-none transition-colors"
                            />
                            <span className="text-[11px] text-muted-foreground/40">–</span>
                            <input
                              type="time"
                              value={editForm.endTime}
                              onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                              className="flex-1 text-[12px] bg-muted/40 rounded-lg px-2.5 h-7 border border-border/40 focus:border-foreground/25 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <RiCalendarEventLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="text-[12px] font-medium text-foreground">
                          {selected.start?.dateTime
                            ? formatDateMed(selected.start.dateTime)
                            : formatDateMed(undefined, selected.start?.date)}
                        </span>
                      </div>
                      {selected.start?.dateTime ? (
                        <div className="flex items-center gap-3">
                          <RiTimeLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-[12px] text-muted-foreground">
                            {formatTime(selected.start.dateTime)}
                            {selected.end?.dateTime && <> &ndash; {formatTime(selected.end.dateTime)}</>}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <RiTimeLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-[12px] text-muted-foreground">All day</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Details body */}
                <div className="px-5 py-4 space-y-5">

                  {/* Priority */}
                  {selected.id && (
                    <div className="space-y-2">
                      <p className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Priority</p>
                      <div className="flex gap-1.5">
                        {(["high", "medium", "low"] as Priority[]).map((p) => {
                          const cfg = PRIORITY[p];
                          const active = priorities[selected.id!] === p;
                          return (
                            <button
                              key={p}
                              onClick={() => setPriority(selected.id!, active ? null : p)}
                              className="flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-all duration-150"
                              style={active
                                ? { backgroundColor: cfg.bg, borderColor: cfg.color + "50", color: cfg.color }
                                : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", opacity: 0.7 }}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Event Color */}
                  {selected.id && !editMode && (
                    <div className="space-y-2">
                      <p className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const calColor = selected._calendarId ? (calColorMap[selected._calendarId] ?? GCAL_DEFAULT) : GCAL_DEFAULT;
                          return (
                            <button
                              title="Calendar default"
                              onClick={() => handleColorChange(selected.id!, null)}
                              className="size-5 rounded-full transition-all hover:scale-110 focus:outline-none relative"
                              style={{
                                backgroundColor: calColor,
                                boxShadow: !selected.colorId ? `0 0 0 2px var(--background), 0 0 0 3.5px ${calColor}` : undefined,
                              }}
                            >
                              {selected.colorId && (
                                <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[8px] font-bold">↺</span>
                              )}
                            </button>
                          );
                        })()}
                        {Object.entries(GCAL_COLORS).map(([id, { hex, name }]) => (
                          <button
                            key={id}
                            title={name}
                            onClick={() => handleColorChange(selected.id!, id)}
                            className="size-5 rounded-full transition-all hover:scale-110 focus:outline-none"
                            style={{
                              backgroundColor: hex,
                              boxShadow: selected.colorId === id ? `0 0 0 2px var(--background), 0 0 0 3.5px ${hex}` : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar (edit mode) */}
                  {editMode && calendars.length > 1 && (
                    <div className="space-y-2">
                      <label className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Calendar</label>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: calendars.find((c) => c.id === editForm.calendarId)?.color ?? GCAL_DEFAULT }}
                        />
                        <select
                          value={editForm.calendarId}
                          onChange={(e) => setEditForm((f) => ({ ...f, calendarId: e.target.value }))}
                          className="flex-1 text-[12px] bg-muted/40 border border-border/40 rounded-lg px-2.5 h-7 focus:outline-none focus:border-foreground/25 transition-colors"
                        >
                          {calendars.map((cal) => (
                            <option key={cal.id} value={cal.id}>{cal.summary ?? cal.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Calendar (view mode) */}
                  {!editMode && selected._calendarId && calendars.length > 1 && (() => {
                    const cal = calendars.find((c) => c.id === selected._calendarId);
                    return cal ? (
                      <div className="flex items-center gap-2.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cal.color }} />
                        <span className="text-[12px] text-muted-foreground truncate">{cal.summary ?? cal.id}</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Location */}
                  {editMode ? (
                    <div className="space-y-2">
                      <label className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Location</label>
                      <input
                        value={editForm.location}
                        onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder="Add location"
                        className="w-full text-[12px] bg-muted/40 rounded-lg px-2.5 h-7 border border-border/40 focus:border-foreground/25 focus:outline-none transition-colors placeholder:text-muted-foreground/30"
                      />
                    </div>
                  ) : selected.location ? (
                    <div className="flex items-start gap-3">
                      <RiMapPinLine className="size-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <span className="text-[12px] text-foreground/80 leading-relaxed">{selected.location}</span>
                    </div>
                  ) : null}

                  {/* Description */}
                  {editMode ? (
                    <div className="space-y-2">
                      <label className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Notes</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Add notes"
                        rows={4}
                        className="w-full text-[12px] bg-muted/40 border border-border/40 rounded-lg px-2.5 py-2 focus:outline-none focus:border-foreground/25 transition-colors placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em] flex items-center justify-between">
                        Notes
                        {notesSaving && <span className="text-[9px] font-normal normal-case text-muted-foreground/40">Saving…</span>}
                      </p>
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        onBlur={handleNotesSave}
                        placeholder="Add notes…"
                        rows={3}
                        className="w-full text-[12px] bg-muted/40 border border-border/40 rounded-lg px-2.5 py-2 focus:outline-none focus:border-foreground/25 transition-colors placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Guests */}
                  {editMode ? (
                    <div className="space-y-2">
                      <label className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em]">Guests</label>
                      <input
                        value={editForm.attendees}
                        onChange={(e) => setEditForm((f) => ({ ...f, attendees: e.target.value }))}
                        placeholder="email@company.com, ..."
                        className="w-full text-[12px] bg-muted/40 rounded-lg px-2.5 h-7 border border-border/40 focus:border-foreground/25 focus:outline-none transition-colors placeholder:text-muted-foreground/30"
                      />
                    </div>
                  ) : (selected.attendees?.length ?? 0) > 0 ? (
                    <div className="space-y-2.5">
                      <p className="text-[9.5px] font-semibold text-muted-foreground/45 uppercase tracking-[0.13em] flex items-center gap-1.5">
                        <RiGroupLine className="size-3 opacity-60" />
                        Guests ({selected.attendees!.length})
                      </p>
                      <div className="space-y-2">
                        {selected.attendees!.map((a) => {
                          const initials = (a.displayName ?? a.email ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                          const status = a.responseStatus ?? "";
                          const isAccepted = status === "accepted";
                          const isDeclined = status === "declined";
                          return (
                            <div key={a.email} className="flex items-center gap-2.5">
                              <div className={`size-6 flex items-center justify-center shrink-0 text-[9px] font-semibold rounded-full ${isAccepted ? "bg-emerald-500/10 text-emerald-600" : isDeclined ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-medium truncate leading-tight">{a.displayName ?? a.email}</p>
                                {a.displayName && <p className="text-[10px] text-muted-foreground/60 truncate leading-none mt-0.5">{a.email}</p>}
                              </div>
                              <span className={`text-[9px] font-medium shrink-0 px-1.5 py-0.5 rounded-full ${isAccepted ? "text-emerald-600 bg-emerald-500/10" : isDeclined ? "text-red-500 bg-red-500/10" : "text-muted-foreground bg-muted/60"}`}>
                                {RESPONSE_LABELS[status] ?? "Invited"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* GCal link */}
                  {!editMode && selected.htmlLink && (
                    <a
                      href={selected.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      <RiExternalLinkLine className="size-3" />
                      Open in Google Calendar
                    </a>
                  )}
                </div>
              </div>

              {/* Panel footer */}
              <div className="px-5 py-3.5 border-t border-border/40 shrink-0">
                {editMode ? (
                  <div className="flex gap-2">
                    <button
                      disabled={saving || !editForm.title.trim()}
                      onClick={handleSave}
                      className="flex-1 h-8 text-[12px] font-medium bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-35 active:scale-[0.98] transition-all duration-150"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => setEditMode(false)}
                      className="h-8 px-4 text-[12px] font-medium border border-border/60 rounded-xl text-foreground hover:bg-muted/60 disabled:opacity-35 transition-all duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(selected)}
                      className="flex-1 h-8 text-[12px] font-medium border border-border/60 rounded-xl text-foreground hover:bg-muted/60 transition-all duration-150 flex items-center justify-center gap-1.5"
                    >
                      <RiPencilLine className="size-3.5" />
                      Edit
                    </button>
                    <button
                      disabled={deleting}
                      onClick={() => selected.id && handleDelete(selected.id)}
                      className="flex-1 h-8 text-[12px] font-medium rounded-xl border border-red-200/50 text-red-500/80 hover:text-red-500 hover:bg-red-50/60 disabled:opacity-35 transition-all duration-150 flex items-center justify-center gap-1.5"
                    >
                      <RiDeleteBin6Line className="size-3.5" />
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Event Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) setForm({ title: "", date: todayStr, startTime: "09:00", endTime: "10:00", location: "", attendees: "", description: "", allDay: false, calendarId: calendars[0]?.id ?? "primary" });
          setShowCreate(open);
        }}
      >
        <DialogContent
          className="sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/50 shadow-2xl"
          showCloseButton={false}
        >
          {/* Dialog header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <DialogTitle className="text-[13px] font-semibold text-foreground">New Event</DialogTitle>
            <DialogDescription className="sr-only">Create a new event in Google Calendar</DialogDescription>
            <button
              onClick={() => setShowCreate(false)}
              className="size-6 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 transition-all"
            >
              <RiCloseLine className="size-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
            {/* Title */}
            <div className="px-6 pt-4 pb-3">
              <Input
                autoFocus
                placeholder="Event title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
                className="h-10 text-[15px] font-medium placeholder:text-muted-foreground/35 border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 shadow-none focus:border-foreground/30 transition-colors bg-transparent"
              />
            </div>

            <div className="px-6 pb-4 space-y-4">
              {/* When */}
              <div className="space-y-2.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/45">When</p>

                <div className="flex items-center gap-3">
                  <RiCalendarEventLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="flex-1 min-w-0 h-8 text-[12px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25"
                  />
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60 cursor-pointer select-none shrink-0 hover:text-foreground transition-colors">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
                      className="size-3.5 accent-foreground cursor-pointer"
                    />
                    All day
                  </label>
                </div>

                {!form.allDay && (
                  <div className="flex items-center gap-3">
                    <RiTimeLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="flex-1 min-w-0 h-8 text-[12px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25"
                      />
                      <span className="text-muted-foreground/35 text-sm shrink-0">→</span>
                      <Input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="flex-1 min-w-0 h-8 text-[12px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border/30" />

              {/* Details */}
              <div className="space-y-2.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/45">Details</p>

                {calendars.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: calendars.find((c) => c.id === form.calendarId)?.color ?? GCAL_DEFAULT }}
                    />
                    <select
                      value={form.calendarId}
                      onChange={(e) => setForm((f) => ({ ...f, calendarId: e.target.value }))}
                      className="flex-1 h-8 text-[12px] bg-muted/40 border border-border/40 rounded-lg px-2.5 focus:outline-none focus:border-foreground/25 transition-colors"
                    >
                      {calendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>{cal.summary ?? cal.id}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <RiMapPinLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                  <Input
                    placeholder="Add location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="flex-1 h-8 text-[12px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25 placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <RiGroupLine className="size-3.5 text-muted-foreground/50 shrink-0" />
                  <Input
                    placeholder="Invite people"
                    value={form.attendees}
                    onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))}
                    className="flex-1 h-8 text-[12px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25 placeholder:text-muted-foreground/30"
                  />
                </div>

                <Textarea
                  placeholder="Add notes or agenda…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="text-[12px] resize-none min-h-[72px] rounded-lg border-border/40 bg-muted/40 focus-visible:ring-0 focus:border-foreground/25 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="h-8 px-4 text-[12px] font-medium border border-border/60 rounded-xl text-foreground hover:bg-muted/60 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              disabled={!form.title.trim() || creating}
              onClick={handleCreate}
              className="h-8 px-5 text-[12px] font-medium bg-foreground text-background rounded-xl hover:opacity-90 disabled:opacity-35 active:scale-[0.98] transition-all duration-150"
            >
              {creating ? "Creating…" : "Create Event"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
