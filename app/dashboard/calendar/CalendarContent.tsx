"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type {
  DateSelectArg, DatesSetArg, EventClickArg, EventContentArg,
  EventDropArg, EventInput,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";

import ReconnectBanner from "@/components/layout/ReconnectBanner";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarSidebarList from "@/components/calendar/CalendarSidebarList";
import EventDetailPanel from "@/components/calendar/EventDetailPanel";
import CreateEventDialog from "@/components/calendar/CreateEventDialog";

import type { CalendarEvent, CalendarInfo, CalendarView, CreateEventForm, EditEventForm, Priority } from "@/types/calendar";
import {
  CALENDAR_PALETTE, COLORS_STORAGE_KEY, DEFAULT_PANEL_WIDTH,
  GCAL_COLORS, GCAL_DEFAULT, PRIORITY_CONFIG, PRIORITY_STORAGE_KEY,
} from "@/constants/calendar";
import {
  buildEventBody, localDateStr, localTimeStr, parseDescription, todayDateStr,
} from "@/lib/calendar-helpers";
import { useResizablePanel } from "@/hooks/useResizablePanel";

import { calEventsCache, calListCache, clearAllCaches, findCachedEventsForRange, prefetchDrafts } from "@/lib/client-cache";

function calEventsCacheKey(userId: string, calIds: string[], min: string, max: string) {
  return `${userId}|${calIds.join(",")}|${min}|${max}`;
}

interface CalendarContentProps {
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

const DEFAULT_CREATE_FORM: CreateEventForm = {
  title: "", date: todayDateStr(), startTime: "09:00", endTime: "10:00",
  location: "", attendees: "", description: "", allDay: false, calendarId: "primary",
};

export default function CalendarContent({ user, gmailConnected, calendarConnected }: CalendarContentProps) {
  // ── Calendar data ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [enabledCals, setEnabledCals] = useState<Set<string>>(new Set());
  const [calColors, setCalColors] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(COLORS_STORAGE_KEY) ?? "{}"); } catch { return {}; }
  });
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  // ── Event detail panel ─────────────────────────────────────────────────────
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditEventForm>({
    title: "", date: "", startTime: "", endTime: "", location: "", description: "", attendees: "", calendarId: "primary",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const [calendarExpired, setCalendarExpired] = useState(false);

  // ── Create event dialog ────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateEventForm>(DEFAULT_CREATE_FORM);

  // ── Priorities (localStorage) ──────────────────────────────────────────────
  const [priorities, setPriorities] = useState<Record<string, Priority>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(PRIORITY_STORAGE_KEY) ?? "{}"); } catch { return {}; }
  });

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());

  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const dateRange = useRef<{ min: string; max: string } | null>(null);
  const api = () => calendarRef.current?.getApi();

  const { width: panelWidth, onDividerMouseDown } = useResizablePanel({
    defaultWidth: DEFAULT_PANEL_WIDTH,
    min: 280,
    max: 560,
    direction: "left",
  });

  // ── Clear all shared caches when the logged-in user changes ─────────────
  useEffect(() => {
    clearAllCaches();
  }, [user?.id]);

  // ── Webhook-driven calendar refresh — poll every 30s ─────────────────────
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let lastChecked = new Date().toISOString();

    const interval = setInterval(async () => {
      try {
        const qs = new URLSearchParams({ userId, since: lastChecked });
        const res = await fetch(`/api/webhooks/calendar?${qs}`);
        const data = await res.json();
        lastChecked = new Date().toISOString();
        if (!data.hasUpdate) return;

        const a = api();
        if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
      } catch {
        // silent
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync notes with selected event ────────────────────────────────────────
  useEffect(() => {
    setNotesValue(selected?.description ? parseDescription(selected.description) : "");
  }, [selected?.id]);

  // ── Load calendars on mount ────────────────────────────────────────────────
  useEffect(() => {
    const userId = user?.id ?? "";
    const cached = calListCache.get(userId);
    if (cached) {
      // Fresh calendar list — apply immediately without a network request.
      const list = cached.list.map((c, i) => ({
        ...c,
        color: calColors[c.id] ?? CALENDAR_PALETTE[i % CALENDAR_PALETTE.length],
      }));
      const enabled = new Set(list.map((c) => c.id));
      setCalendars(list);
      setEnabledCals(enabled);
      if (list.length > 0) setForm((f) => ({ ...f, calendarId: list[0].id }));
      if (dateRange.current) loadEvents(dateRange.current.min, dateRange.current.max, enabled);
      return;
    }

    fetch("/api/calendar/calendars")
      .then((r) => r.json())
      .then(({ calendars: raw = [] }: { calendars: { id: string; summary?: string }[] }) => {
        const list: CalendarInfo[] = raw.map((c, i) => ({
          id: c.id,
          summary: c.summary,
          color: calColors[c.id] ?? CALENDAR_PALETTE[i % CALENDAR_PALETTE.length],
        }));
        calListCache.set(userId, { list, fetchedAt: Date.now() });
        const enabled = new Set(list.map((c) => c.id));
        setCalendars(list);
        setEnabledCals(enabled);
        if (list.length > 0) setForm((f) => ({ ...f, calendarId: list[0].id }));
        if (dateRange.current) loadEvents(dateRange.current.min, dateRange.current.max, enabled);
      })
      .catch(() => {
        const fallback: CalendarInfo[] = [{ id: "primary", summary: "My Calendar", color: GCAL_DEFAULT }];
        const enabled = new Set(["primary"]);
        setCalendars(fallback);
        setEnabledCals(enabled);
        if (dateRange.current) loadEvents(dateRange.current.min, dateRange.current.max, enabled);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── API calls ──────────────────────────────────────────────────────────────

  const loadEvents = async (min: string, max: string, calIds?: Set<string>, force = false) => {
    const ids = [...(calIds ?? enabledCals)].sort();
    if (ids.length === 0) { setEvents([]); return; }

    const userId = user?.id ?? "";
    const key = calEventsCacheKey(userId, ids, min, max);
    // Check exact key first, then fall back to any wider cached range (e.g. prefetch).
    const cached = calEventsCache.get(key) ?? findCachedEventsForRange(userId, ids, min, max);

    if (!force && cached) {
      setEvents(cached.events);
      setLoading(false);
      // Cache is session-scoped (Infinity TTL) — skip the network round-trip.
      // The 30s webhook poll handles any real-time changes while the user is here.
      return;
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/calendar/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&calendarIds=${encodeURIComponent(ids.join(","))}`;
      const res = await fetch(url);
      if (res.status === 401) {
        const data = await res.json();
        if (data?.error === "connection_expired") { setCalendarExpired(true); return; }
      }
      setCalendarExpired(false);
      if (res.ok) {
        const freshEvents: CalendarEvent[] = (await res.json()).events ?? [];
        calEventsCache.set(key, { events: freshEvents, fetchedAt: Date.now() });
        setEvents(freshEvents);
      }
    } finally {
      setLoading(false);
    }
  };

  // Drops the cache entry for the currently visible date range so the next
  // loadEvents call always fetches fresh data after a mutation.
  const invalidateEventsCache = () => {
    const a = api();
    if (!a) return;
    const ids = [...enabledCals].sort();
    const key = calEventsCacheKey(user?.id ?? "", ids, a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
    calEventsCache.delete(key);
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
            end:   form.allDay ? { date: form.date } : { dateTime: `${form.date}T${form.endTime}:00`, timeZone: tz },
            attendees: guests.length ? guests : undefined,
          },
          sendUpdates: "all",
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ ...DEFAULT_CREATE_FORM, calendarId: calendars[0]?.id ?? "primary" });
        invalidateEventsCache();
        const a = api();
        if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
      }
    } finally { setCreating(false); }
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
        end:   isAllDay ? { date: editForm.date } : { dateTime: `${editForm.date}T${editForm.endTime}:00`, timeZone: tz },
        attendees: guests.length ? guests : undefined,
      };

      const calendarMoved = editForm.calendarId && editForm.calendarId !== selected._calendarId;
      if (calendarMoved) {
        await fetch(`/api/calendar/events/${selected.id}?calendarId=${encodeURIComponent(selected._calendarId ?? "primary")}`, { method: "DELETE" });
        await fetch("/api/calendar/events", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarId: editForm.calendarId, event: patch, sendUpdates: "all" }),
        });
        setSelected(null); setEditMode(false);
        invalidateEventsCache();
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

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
      setSelected(null);
      invalidateEventsCache();
      const a = api();
      if (a) await loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString());
    } finally { setDeleting(false); }
  };

  const handleColorChange = async (id: string, colorId: string | null) => {
    const eventForId = events.find((e) => e.id === id) ?? (selected?.id === id ? selected : null);
    if (!eventForId) return;
    const calColor = (eventForId._calendarId ? calColorMap[eventForId._calendarId] : undefined) ?? GCAL_DEFAULT;
    const newBg = colorId ? (GCAL_COLORS[colorId]?.hex ?? GCAL_DEFAULT) : calColor;
    const prevEvents = events;
    const prevSelected = selected;

    setEvents((p) => p.map((e) => (e.id === id ? { ...e, colorId: colorId ?? undefined } : e)));
    setSelected((p) => p?.id === id ? { ...p, colorId: colorId ?? undefined } : p);
    const fc = api()?.getEventById(id);
    fc?.setProp("backgroundColor", newBg);

    try {
      const overrides = colorId ? { colorId } : { colorId: undefined };
      const eventBody = buildEventBody(eventForId, overrides);
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: eventForId._calendarId ?? "primary", event: eventBody, sendUpdates: "none" }),
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
        body: JSON.stringify({ calendarId: selected._calendarId ?? "primary", event: eventBody, sendUpdates: "none" }),
      });
      if (res.ok) {
        setSelected((p) => p ? { ...p, description: notesValue } : p);
        setEvents((prev) => prev.map((e) => e.id === selected.id ? { ...e, description: notesValue } : e));
      }
    } finally { setNotesSaving(false); }
  };

  // ── FullCalendar event handlers ───────────────────────────────────────────

  const handleDatesSet = (info: DatesSetArg) => {
    const min = info.start.toISOString();
    const max = info.end.toISOString();
    dateRange.current = { min, max };
    setTitle(info.view.title);
    setView(info.view.type as CalendarView);
    setVisibleMonth(info.view.currentStart);
    if (enabledCals.size > 0) loadEvents(min, max);
  };

  const handleMiniDateSelect = (date: Date) => {
    setSelectedDate(date);
    setVisibleMonth(date);
    api()?.gotoDate(date);
  };

  const handleSelect = (info: DateSelectArg) => {
    const startT = localTimeStr(info.start);
    const endT = localTimeStr(info.end);
    setForm({
      title: "", date: localDateStr(info.start),
      startTime: info.allDay ? "09:00" : startT,
      endTime: info.allDay ? "10:00" : (endT === "00:00" ? "10:00" : endT),
      location: "", attendees: "", description: "", allDay: info.allDay,
      calendarId: calendars[0]?.id ?? "primary",
    });
    setShowCreate(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    setSelected(events.find((e) => e.id === info.event.id) ?? (info.event.extendedProps._raw as CalendarEvent));
    setEditMode(false);
  };

  // Google Calendar exposes no partial `patch` here — events.update is a full
  // replace. Always rebuild the complete event body so dragging/resizing only
  // changes the times and never wipes title, notes, attendees, or colour.
  const persistTimeChange = async (
    info: EventDropArg | EventResizeDoneArg,
    start: CalendarEvent["start"],
    end: CalendarEvent["end"],
  ) => {
    const { event } = info;
    const source = events.find((e) => e.id === event.id);
    if (!source) { info.revert(); return; }
    const res = await fetch(`/api/calendar/events/${event.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendarId: source._calendarId,
        event: buildEventBody(source, { start, end }),
        sendUpdates: "all",
      }),
    }).catch(() => null);
    if (!res?.ok) { info.revert(); return; }
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, start, end } : e)));
    setSelected((p) => (p?.id === event.id ? { ...p, start, end } : p));
  };

  const handleDrop = async (info: EventDropArg) => {
    const { event } = info;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = event.allDay
      ? { date: event.startStr.split("T")[0] }
      : { dateTime: event.startStr, timeZone: tz };
    const end = event.allDay
      ? { date: (event.endStr || event.startStr).split("T")[0] }
      : { dateTime: event.endStr ?? event.startStr, timeZone: tz };
    await persistTimeChange(info, start, end);
  };

  const handleResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await persistTimeChange(
      info,
      { dateTime: event.startStr, timeZone: tz },
      { dateTime: event.endStr ?? event.startStr, timeZone: tz },
    );
  };

  // ── Calendar sidebar handlers ─────────────────────────────────────────────

  const toggleCalendar = (id: string) => {
    setEnabledCals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const a = api();
      if (a) loadEvents(a.view.activeStart.toISOString(), a.view.activeEnd.toISOString(), next);
      return next;
    });
  };

  const applyCalColor = (calId: string, hex: string) => {
    setCalColors((prev) => {
      const next = { ...prev, [calId]: hex };
      localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setCalendars((prev) => prev.map((c) => c.id === calId ? { ...c, color: hex } : c));
    setColorPickerFor(null);
  };

  const setPriority = (id: string, p: Priority | null) => {
    setPriorities((prev) => {
      const next = { ...prev };
      if (p) next[id] = p; else delete next[id];
      localStorage.setItem(PRIORITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const startEdit = (ev: CalendarEvent) => {
    const s = ev.start?.dateTime ? new Date(ev.start.dateTime) : null;
    const e = ev.end?.dateTime ? new Date(ev.end.dateTime) : null;
    setEditForm({
      title: ev.summary ?? "",
      date: s ? localDateStr(s) : (ev.start?.date ?? ""),
      startTime: s ? localTimeStr(s) : "09:00",
      endTime: e ? localTimeStr(e) : "10:00",
      location: ev.location ?? "",
      description: ev.description ? parseDescription(ev.description) : "",
      attendees: ev.attendees?.map((a) => a.email ?? "").join(", ") ?? "",
      calendarId: ev._calendarId ?? calendars[0]?.id ?? "primary",
    });
    setEditMode(true);
  };

  // ── FullCalendar event content renderer ──────────────────────────────────

  const calColorMap = Object.fromEntries(calendars.map((c) => [c.id, c.color]));

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const p = priorities[arg.event.id ?? ""] as Priority | undefined;
    const pc = p ? PRIORITY_CONFIG[p] : null;
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

  // ── Derived FullCalendar event list ───────────────────────────────────────

  const fcEvents: EventInput[] = events.map((e) => {
    const calColor = (e._calendarId ? calColorMap[e._calendarId] : undefined) ?? GCAL_DEFAULT;
    const bgColor = e.colorId ? (GCAL_COLORS[e.colorId]?.hex ?? GCAL_DEFAULT) : calColor;
    return {
      id: e.id,
      title: e.summary ?? "(No title)",
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      allDay: !e.start?.dateTime,
      backgroundColor: bgColor,
      borderColor: calColor,
      textColor: "#1f2937",
      extendedProps: { _raw: e, _calendarColor: calColor, _hasOwnColor: !!e.colorId },
    };
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={user}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
        onPrefetchFolder={(id) => {
          const userId = user?.id;
          if (!userId) return;
          if (id === "drafts") prefetchDrafts(userId);
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav user={user} gmailConnected={gmailConnected} />

        {calendarExpired && <ReconnectBanner plugin="googlecalendar" />}

        <div className="flex-1 flex flex-col overflow-hidden p-4 pt-0 gap-4">
          <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl flex flex-col flex-1">
            <CalendarToolbar
              title={title}
              view={view}
              loading={loading}
              onPrev={() => api()?.prev()}
              onNext={() => api()?.next()}
              onToday={() => api()?.today()}
              onChangeView={(v) => { api()?.changeView(v); setView(v); }}
              onNewEvent={() => setShowCreate(true)}
            />

            <div className="flex-1 flex overflow-hidden min-w-0">
              <CalendarSidebarList
                calendars={calendars}
                enabledCals={enabledCals}
                colorPickerFor={colorPickerFor}
                selectedDate={selectedDate}
                visibleMonth={visibleMonth}
                onToggle={toggleCalendar}
                onColorChange={applyCalColor}
                onOpenColorPicker={setColorPickerFor}
                onDateSelect={handleMiniDateSelect}
              />

              <div className="flex-1 overflow-hidden min-w-0 p-3">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={false}
                  height="100%"
                  events={fcEvents}
                  eventDisplay="block"
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

              {selected && (
                <EventDetailPanel
                  selected={selected}
                  editMode={editMode}
                  editForm={editForm}
                  saving={saving}
                  deleting={deleting}
                  panelWidth={panelWidth}
                  calendars={calendars}
                  calColorMap={calColorMap}
                  priorities={priorities}
                  notesValue={notesValue}
                  notesSaving={notesSaving}
                  onClose={() => { setSelected(null); setEditMode(false); }}
                  onStartEdit={() => startEdit(selected)}
                  onCancelEdit={() => setEditMode(false)}
                  onSave={handleSave}
                  onDelete={() => selected.id && handleDelete(selected.id)}
                  onEditFormChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                  onColorChange={handleColorChange}
                  onPriorityChange={setPriority}
                  onNotesChange={setNotesValue}
                  onNotesSave={handleNotesSave}
                  onDividerMouseDown={onDividerMouseDown}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateEventDialog
        open={showCreate}
        form={form}
        calendars={calendars}
        creating={creating}
        onOpenChange={(open) => {
          if (!open) setForm({ ...DEFAULT_CREATE_FORM, calendarId: calendars[0]?.id ?? "primary" });
          setShowCreate(open);
        }}
        onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onCreate={handleCreate}
      />

      <SettingsOverlay
        user={user}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />
    </div>
  );
}
