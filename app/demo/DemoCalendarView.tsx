"use client";

import { useCallback, useRef, useState } from "react";
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

import DemoBanner from "./DemoBanner";
import DemoSignInModal from "./DemoSignInModal";
import { useDemoContext } from "@/lib/demo/DemoContext";

const DEFAULT_CREATE_FORM: CreateEventForm = {
  title: "", date: todayDateStr(), startTime: "09:00", endTime: "10:00",
  location: "", attendees: "", description: "", allDay: false, calendarId: "primary",
};

export default function DemoCalendarView() {
  const ctx = useDemoContext();

  // ── Calendar sidebar colors ────────────────────────────────────────────────
  const [calColors, setCalColors] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(COLORS_STORAGE_KEY) ?? "{}"); } catch { return {}; }
  });
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  // Single demo calendar
  const calendars: CalendarInfo[] = [
    { id: "primary", summary: "Alex Carter", color: calColors["primary"] ?? CALENDAR_PALETTE[0] },
  ];
  const [enabledCals, setEnabledCals] = useState<Set<string>>(new Set(["primary"]));

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
  const api = () => calendarRef.current?.getApi();

  const { width: panelWidth, onDividerMouseDown } = useResizablePanel({
    defaultWidth: DEFAULT_PANEL_WIDTH,
    min: 280,
    max: 560,
    direction: "left",
  });

  // ── Sync notes with selected event ────────────────────────────────────────
  const notesForEvent = selected?.description ? parseDescription(selected.description) : "";

  // ── Demo CRUD operations ──────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const guests = form.attendees.split(",").map((s) => s.trim()).filter(Boolean).map((email) => ({ email }));
    const newEvent: CalendarEvent = {
      summary: form.title,
      location: form.location || undefined,
      description: form.description || undefined,
      start: form.allDay ? { date: form.date } : { dateTime: `${form.date}T${form.startTime}:00`, timeZone: tz },
      end:   form.allDay ? { date: form.date } : { dateTime: `${form.date}T${form.endTime}:00`, timeZone: tz },
      attendees: guests.length ? guests : undefined,
      _calendarId: "primary",
    };
    ctx.addEvent(newEvent);
    setShowCreate(false);
    setForm({ ...DEFAULT_CREATE_FORM });
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selected?.id || !editForm.title.trim()) return;
    setSaving(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isAllDay = !selected.start?.dateTime;
    const guests = editForm.attendees.split(",").map((s) => s.trim()).filter(Boolean).map((email) => ({ email }));
    const patch: Partial<CalendarEvent> = {
      summary: editForm.title,
      location: editForm.location || undefined,
      description: editForm.description || undefined,
      start: isAllDay ? { date: editForm.date } : { dateTime: `${editForm.date}T${editForm.startTime}:00`, timeZone: tz },
      end:   isAllDay ? { date: editForm.date } : { dateTime: `${editForm.date}T${editForm.endTime}:00`, timeZone: tz },
      attendees: guests.length ? guests : undefined,
    };
    ctx.updateEvent(selected.id, patch);
    const updated = { ...selected, ...patch };
    setSelected(updated);
    const fc = api()?.getEventById(selected.id);
    if (fc) {
      fc.setProp("title", editForm.title);
      if (!isAllDay) {
        fc.setStart(`${editForm.date}T${editForm.startTime}:00`);
        fc.setEnd(`${editForm.date}T${editForm.endTime}:00`);
      }
    }
    setEditMode(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    ctx.deleteEvent(id);
    setSelected(null);
    setDeleting(false);
  };

  const handleColorChange = async (id: string, colorId: string | null) => {
    ctx.updateEvent(id, { colorId: colorId ?? undefined });
    setSelected((p) => p?.id === id ? { ...p, colorId: colorId ?? undefined } : p);
    const calColor = calColors["primary"] ?? GCAL_DEFAULT;
    const newBg = colorId ? (GCAL_COLORS[colorId]?.hex ?? GCAL_DEFAULT) : calColor;
    api()?.getEventById(id)?.setProp("backgroundColor", newBg);
  };

  const handleNotesSave = async () => {
    if (!selected?.id) return;
    const current = selected.description ? parseDescription(selected.description) : "";
    if (notesValue === current) return;
    setNotesSaving(true);
    ctx.updateEvent(selected.id, { description: notesValue || undefined });
    setSelected((p) => p ? { ...p, description: notesValue } : p);
    setNotesSaving(false);
  };

  // ── FullCalendar event handlers ───────────────────────────────────────────

  const handleDatesSet = (info: DatesSetArg) => {
    setTitle(info.view.title);
    setView(info.view.type as CalendarView);
    setVisibleMonth(info.view.currentStart);
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
      calendarId: "primary",
    });
    setShowCreate(true);
  };

  const handleEventClick = (info: EventClickArg) => {
    const ev = ctx.events.find((e) => e.id === info.event.id) ?? (info.event.extendedProps._raw as CalendarEvent);
    setSelected(ev);
    setNotesValue(ev?.description ? parseDescription(ev.description) : "");
    setEditMode(false);
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
    ctx.updateEvent(event.id ?? "", { start, end });
    setSelected((p) => p?.id === event.id ? { ...p, start, end } : p);
  };

  const handleResize = async (info: EventResizeDoneArg) => {
    const { event } = info;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = { dateTime: event.startStr, timeZone: tz };
    const end = { dateTime: event.endStr ?? event.startStr, timeZone: tz };
    ctx.updateEvent(event.id ?? "", { start, end });
    setSelected((p) => p?.id === event.id ? { ...p, start, end } : p);
  };

  const toggleCalendar = (id: string) => {
    setEnabledCals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyCalColor = (calId: string, hex: string) => {
    setCalColors((prev) => {
      const next = { ...prev, [calId]: hex };
      localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
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
      calendarId: ev._calendarId ?? "primary",
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

  const filteredEvents = ctx.events.filter((e) => enabledCals.has(e._calendarId ?? "primary"));

  const fcEvents: EventInput[] = filteredEvents.map((e) => {
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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          user={ctx.user}
          gmailConnected={true}
          calendarConnected={true}
          basePath="/demo"
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopNav
            user={ctx.user}
            gmailConnected={true}
            basePath="/demo"
            onOpenPalette={() => ctx.setShowSignInModal(true)}
          />

          <div className="flex-1 flex flex-col overflow-hidden p-4 pt-0 gap-4">
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl flex flex-col flex-1">
              <CalendarToolbar
                title={title}
                view={view}
                loading={false}
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
      </div>

      <CreateEventDialog
        open={showCreate}
        form={form}
        calendars={calendars}
        creating={creating}
        onOpenChange={(open) => {
          if (!open) setForm({ ...DEFAULT_CREATE_FORM });
          setShowCreate(open);
        }}
        onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onCreate={handleCreate}
      />

      <SettingsOverlay
        user={ctx.user}
        gmailConnected={false}
        calendarConnected={false}
      />

      <DemoSignInModal />
    </div>
  );
}
